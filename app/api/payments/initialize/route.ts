/**
 * Payment Initialization API
 * 
 * Unified endpoint for all payment gateways:
 * - Chaabi Payment (Morocco - MAD)
 * - PayTech (Senegal - XOF, International - USD)
 * - COD (Cash on Delivery - everywhere)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { computeQuote, ShippingMethod } from '@/lib/pricing';
import { getLocaleFromPath } from '@/lib/i18n';
import { paymentRatelimit, checkRateLimit } from '@/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';
import {
  PaymentProviderFactory,
  // getCountryCode, // Temporarily unused - will be needed when Chaabi is configured
  getCurrencyForCountry,
  OrderPayload,
  PaymentGateway,
} from '@/lib/payments';

// Validation schema
const PaymentInitializationSchema = z.object({
  // Customer info
  firstName: z.string().min(1, 'Prénom requis').optional(),
  lastName: z.string().min(1, 'Nom requis').optional(),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),

  // Shipping info
  address: z.string().min(1, 'Adresse requise').optional(),
  city: z.string().min(1, 'Ville requise').optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express']).optional().default('standard'),

  // Payment options
  locale: z.enum(['fr', 'en']).optional(),
  paymentMethod: z.enum(['paytech', 'cod']).optional(),
  paymentSubMethod: z.string().optional(), // 'wave', 'orange_money', etc.

  // Cart items
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().positive('Quantité doit être positive'),
    price: z.number().positive('Prix doit être positif'),
    name: z.string().optional(),
  })).optional(),

  // Legacy fields for backward compatibility
  orderId: z.string().optional(),
  amount: z.number().optional(),
  customerName: z.string().optional(),
  cartItems: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })).optional(),
}).refine(
  (data) => {
    return (Array.isArray(data.items) && data.items.length > 0) ||
      (Array.isArray(data.cartItems) && data.cartItems.length > 0);
  },
  { message: 'Au moins un article est requis' }
);

/**
 * Determine the payment gateway based on method
 * Now simplified to only PayTech and COD
 */
function determineGateway(_country: string, method?: string): PaymentGateway {
  // If COD explicitly specified
  if (method === 'cod') return 'cod';

  // Everything else goes through PayTech
  return 'paytech';
}

export async function POST(request: NextRequest) {
  try {
    // Get locale from request
    const referer = request.headers.get('referer') || '';
    const path = (() => { try { return new URL(referer).pathname; } catch { return referer; } })();
    let locale: 'fr' | 'en' = 'fr';
    try {
      const peek = await request.clone().json();
      if (peek?.locale === 'en' || peek?.locale === 'fr') locale = peek.locale;
      else locale = getLocaleFromPath(path);
    } catch {
      locale = getLocaleFromPath(path);
    }
    // Note: Translations are loaded when needed for error messages

    // CORS check
    const origin = request.headers.get('origin') || '';
    const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    if (origin && appBase && origin !== appBase) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting
    const rl = await checkRateLimit((() => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'global';
      return `payinit:${String(ip).split(',')[0].trim()}`;
    })(), paymentRatelimit);
    if (!rl.success) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('[Payment Init] Request received:', {
      country: body.country,
      paymentMethod: body.paymentMethod,
      itemCount: body.items?.length || body.cartItems?.length || 0,
    });

    const validatedData = PaymentInitializationSchema.parse(body);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user from auth token (optional)
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : request.cookies.get('sb-auth-token')?.value || null;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Get cart items
    const cartItems = Array.isArray(body.items) ? body.items : (body.cartItems || []);
    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Au moins un article est requis' }, { status: 400 });
    }

    // Fetch and validate products
    const productIds = cartItems.map((i: { product_id: string }) => i.product_id);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, price, "inStock", product_variants(stock)')
      .in('id', productIds);

    if (prodErr) {
      console.error('[Payment Init] Product fetch error:', prodErr);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Check stock availability
    const { data: reservations } = await supabase
      .from('stock_reservations')
      .select('product_id, qty, expires_at, finalized_at, released_at')
      .in('product_id', productIds);

    const now = Date.now();
    const reservedByProduct = new Map<string, number>();
    if (Array.isArray(reservations)) {
      for (const r of reservations) {
        const isFinalized = !!r.finalized_at;
        const isActive = !r.released_at && new Date(r.expires_at).getTime() > now;
        if (isFinalized || isActive) {
          reservedByProduct.set(r.product_id, (reservedByProduct.get(r.product_id) || 0) + Number(r.qty || 0));
        }
      }
    }

    // Normalize and validate cart items
    interface ProductVariant { stock: number; }
    interface Product {
      id: string;
      price: number | string;
      inStock: boolean;
      product_variants?: ProductVariant[];
    }

    const normalized: { product_id: string; price: number; quantity: number; name?: string }[] = [];
    for (const it of cartItems) {
      const p = products?.find((pr: Product) => pr.id === it.product_id) as Product | undefined;
      if (!p || !p.inStock) {
        return NextResponse.json({ error: 'Produit épuisé' }, { status: 400 });
      }

      const hasVariants = Array.isArray(p.product_variants) && p.product_variants.length > 0;
      const totalStock = hasVariants ? p.product_variants!.reduce((s, v) => s + (v?.stock || 0), 0) : null;
      const alreadyReserved = reservedByProduct.get(it.product_id) || 0;

      if (totalStock !== null && (totalStock - alreadyReserved) < Number(it.quantity || 0)) {
        return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
      }

      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      normalized.push({ product_id: it.product_id, price, quantity: Number(it.quantity), name: it.name });
    }

    // Compute quote
    const country = body.country || 'SN';
    const quote = computeQuote({
      items: normalized,
      shippingMethod: (body.shippingMethod || 'standard') as ShippingMethod,
      country
    });
    console.log('[Payment Init] Quote:', quote);

    // Idempotency check (optional - requires Redis)
    let redis: Redis | null = null;
    const idemKey = request.headers.get('idempotency-key') || request.headers.get('Idempotency-Key') || body.orderId || null;
    const idemRedisKey = idemKey ? `idem:payments:init:${idemKey}` : null;

    // Try to initialize Redis for idempotency (graceful fallback if not configured)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        redis = Redis.fromEnv();
        if (idemRedisKey && redis) {
          const existing = await redis.get(idemRedisKey);
          if (existing) {
            const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing;
            return NextResponse.json({
              success: true,
              paymentLink: parsed.paymentLink || parsed.redirect_url,
              reference: parsed.reference,
              orderId: parsed.orderId
            }, { status: 200 });
          }
        }
      } catch (redisErr) {
        console.warn('[Payment Init] Redis not available, skipping idempotency check:', redisErr);
        redis = null;
      }
    }

    // Determine gateway and currency
    const gateway = determineGateway(country, body.paymentMethod);
    const currency = getCurrencyForCountry(country);

    console.log('[Payment Init] Gateway selection:', { country, gateway, currency });

    // Create order
    const orderInsert = {
      user_id: userId,
      order_number: `ORD-${Date.now()}`,
      total: quote.total,
      shipping_address: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: body.address,
        city: body.city,
        zipCode: body.zipCode,
        country: country,
      },
      shipping_method: body.shippingMethod || 'standard',
      status: 'pending',
      payment_status: gateway === 'cod' ? 'awaiting_payment' : 'pending',
      payment_method: gateway,
    };

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select('*')
      .single();

    if (orderErr) {
      console.error('[Payment Init] Order creation error:', orderErr);
      throw orderErr;
    }

    // Insert order items
    if (normalized.length > 0) {
      const itemsPayload = normalized.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        quantity: it.quantity,
        price: it.price,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsErr) {
        console.error('[Payment Init] Order items error:', itemsErr);
        throw itemsErr;
      }
    }

    // Create stock reservations
    const ttlMinutes = Number(process.env.PAYMENT_RESERVATION_TTL_MINUTES || 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    const reservationsPayload = normalized.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      variant_id: null,
      qty: it.quantity,
      expires_at: expiresAt,
    }));
    if (reservationsPayload.length > 0) {
      const { error: resErr } = await supabase.from('stock_reservations').insert(reservationsPayload);
      if (resErr) {
        console.error('[Payment Init] Stock reservation error:', resErr);
        return NextResponse.json({ error: 'Réservation échouée' }, { status: 409 });
      }
    }

    // Build order payload for provider
    const orderPayload: OrderPayload = {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: quote.total,
      currency: currency,
      customer: {
        email: validatedData.email,
        phone: validatedData.phone,
        firstName: body.firstName || '',
        lastName: body.lastName || '',
      },
      shipping: {
        address: body.address || '',
        city: body.city || '',
        zipCode: body.zipCode,
        country: country,
      },
      items: normalized.map(it => ({
        productId: it.product_id,
        name: it.name || '',
        quantity: it.quantity,
        price: it.price,
      })),
      locale: locale,
    };

    // Get the provider and create payment session
    const provider = PaymentProviderFactory.create(gateway);

    if (!provider.isConfigured() && gateway !== 'cod') {
      console.warn(`[Payment Init] ${gateway} not configured`);
      return NextResponse.json({
        error: `Le paiement ${gateway} n'est pas configuré. Veuillez utiliser le paiement à la livraison.`,
        paymentNotConfigured: true
      }, { status: 503 });
    }

    const session = await provider.createSession(orderPayload, body.paymentSubMethod);

    if (!session.success) {
      return NextResponse.json({
        error: session.error || 'Erreur lors de l\'initialisation du paiement'
      }, { status: 500 });
    }

    // Cache for idempotency (only if Redis is available)
    if (idemRedisKey && redis) {
      try {
        await redis.set(idemRedisKey, JSON.stringify({
          orderId: order.id,
          redirect_url: session.redirectUrl,
          reference: session.transactionId,
          gateway: gateway,
        }), { ex: 900 });
      } catch (cacheErr) {
        console.warn('[Payment Init] Failed to cache idempotency:', cacheErr);
      }
    }

    // Return response based on gateway type
    if (session.redirectUrl) {
      // PayTech style - redirect URL
      return NextResponse.json({
        success: true,
        redirect_url: session.redirectUrl,
        paymentLink: session.redirectUrl,
        reference: session.transactionId,
        orderId: order.id,
        gateway: gateway,
      }, { status: 200 });

    } else if (session.formData) {
      // Chaabi style - form submission
      return NextResponse.json({
        success: true,
        formData: session.formData,
        gatewayUrl: session.gatewayUrl,
        orderId: order.id,
        gateway: gateway,
      }, { status: 200 });

    } else if (session.orderConfirmed) {
      // COD - order confirmed directly
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        gateway: 'cod',
        message: 'Commande confirmée. Paiement à la livraison.',
      }, { status: 200 });

    } else {
      return NextResponse.json({
        error: 'Réponse inattendue du système de paiement'
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('[Payment Init] Error:', error);

    Sentry.captureException(error, {
      tags: { route: 'payments/initialize' },
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'initialisation du paiement';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
