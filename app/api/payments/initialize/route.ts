import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initializePayment } from '@/lib/flutterwave';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { computeQuote, ShippingMethod } from '@/lib/pricing';
import { getLocaleFromPath, getTranslations, getTranslationKey } from '@/lib/i18n';
import { paymentRatelimit, checkRateLimit } from '@/lib/rate-limit';

// Validation schema - flexible to accept both checkout form and test data
const PaymentInitializationSchema = z.object({
  // From checkout form
  firstName: z.string().min(1, 'Prénom requis').optional(),
  lastName: z.string().min(1, 'Nom requis').optional(),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  address: z.string().min(1, 'Adresse requise').optional(),
  city: z.string().min(1, 'Ville requise').optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express']).optional().default('standard'),
  locale: z.enum(['fr', 'en']).optional(),
  
  // From cart/items
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
    // Must have either items or cartItems
    return (Array.isArray(data.items) && data.items.length > 0) || 
           (Array.isArray(data.cartItems) && data.cartItems.length > 0);
  },
  { message: 'Au moins un article est requis' }
);

export async function POST(request: NextRequest) {
  try {
    const referer = request.headers.get('referer') || '';
    const path = (() => { try { return new URL(referer).pathname; } catch { return referer; } })();
    let locale: 'fr' | 'en' = 'fr';
    try { const peek = await request.clone().json(); if (peek?.locale === 'en' || peek?.locale === 'fr') locale = peek.locale; else locale = getLocaleFromPath(path); } catch { locale = getLocaleFromPath(path); }
    const commonNs = await getTranslations(locale, 'common');
    const productNs = await getTranslations(locale, 'product');

    const origin = request.headers.get('origin') || '';
    const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    if (origin && appBase && origin !== appBase) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Forbidden';
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const rl = await checkRateLimit((() => {
      const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'global';
      return `payinit:${String(ip).split(',')[0].trim()}`;
    })(), paymentRatelimit);
    if (!rl.success) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Too many requests';
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    const body = await request.json();
    console.log('[Payment Init] Request body:', JSON.stringify(body, null, 2));
    
    const validatedData = PaymentInitializationSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user from auth token
    let userId: string | null = null;
    let token: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = request.cookies.get('sb-auth-token')?.value || null;
    }

    if (token) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
      }
    }

    // Use items or cartItems (for backward compatibility)
    const cartItems = Array.isArray(body.items) ? body.items : (Array.isArray(body.cartItems) ? body.cartItems : []);
    
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Au moins un article est requis';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const productIds = cartItems.map((i: any) => i.product_id);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, price, "inStock", product_variants(stock)')
      .in('id', productIds);
    if (prodErr) {
      console.error('[Payment Init] Product fetch error:', prodErr);
      const msg = getTranslationKey(commonNs, 'common.error') || 'Server error';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Fetch existing reservations to account for availability
    const { data: reservations } = await supabase
      .from('stock_reservations')
      .select('product_id, qty, expires_at, finalized_at, released_at')
      .in('product_id', productIds);
    const now = Date.now();
    const reservedByProduct = new Map<string, number>();
    if (Array.isArray(reservations)) {
      for (const r of reservations as any[]) {
        const isFinalized = !!r.finalized_at;
        const isActive = !r.released_at && new Date(r.expires_at).getTime() > now;
        if (isFinalized || isActive) {
          reservedByProduct.set(r.product_id, (reservedByProduct.get(r.product_id) || 0) + Number(r.qty || 0));
        }
      }
    }

    const normalized = [] as { product_id: string; price: number; quantity: number }[];
    for (const it of cartItems) {
      const p = products?.find((pr: any) => pr.id === it.product_id);
      if (!p || !p.inStock) {
        const msg = getTranslationKey(productNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const hasVariants = Array.isArray(p.product_variants) && p.product_variants.length > 0;
      const totalStock = hasVariants ? p.product_variants.reduce((s: number, v: any) => s + (v?.stock || 0), 0) : null;
      const alreadyReserved = reservedByProduct.get(it.product_id) || 0;
      if (totalStock !== null && (totalStock - alreadyReserved) < Number(it.quantity || 0)) {
        const msg = getTranslationKey(productNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      normalized.push({ product_id: it.product_id, price, quantity: Number(it.quantity) || 0 });
    }

    const quote = computeQuote({ items: normalized, shippingMethod: (body.shippingMethod || 'standard') as ShippingMethod, country: body.country });
    console.log('[Payment Init] Computed quote:', JSON.stringify(quote, null, 2));

    const redis = Redis.fromEnv();
    const idemKey = request.headers.get('idempotency-key') || request.headers.get('Idempotency-Key') || body.orderId || null;
    const idemRedisKey = idemKey ? `idem:payments:init:${idemKey}` : null;
    if (idemRedisKey) {
      const existing = await redis.get(idemRedisKey);
      if (existing) {
        const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing;
        return NextResponse.json({ success: true, paymentLink: parsed.paymentLink, reference: parsed.reference, orderId: parsed.orderId }, { status: 200 });
      }
    }

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
        country: body.country,
      },
      shipping_method: body.shippingMethod || 'standard',
      status: 'pending',
      payment_status: 'pending',
    } as any;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select('*')
      .single();
    if (orderErr) {
      console.error('[Payment Init] Order creation error:', orderErr);
      throw orderErr;
    }

    if (normalized.length > 0) {
      const itemsPayload = normalized.map((it: any) => ({
        order_id: order.id,
        product_id: it.product_id,
        quantity: it.quantity,
        price: it.price,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsErr) {
        console.error('[Payment Init] Order items creation error:', itemsErr);
        throw itemsErr;
      }
    }

    // Create stock reservations for this pending order
    const ttlMinutes = Number(process.env.PAYMENT_RESERVATION_TTL_MINUTES || 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    const reservationsPayload = normalized.map((it: any) => ({
      order_id: order.id,
      product_id: it.product_id,
      variant_id: null,
      qty: it.quantity,
      expires_at: expiresAt,
    }));
    if (reservationsPayload.length > 0) {
      const { error: resErr } = await supabase.from('stock_reservations').insert(reservationsPayload as any);
      if (resErr) {
        console.error('[Payment Init] Stock reservation error:', resErr);
        const msg = getTranslationKey(commonNs, 'common.error') || 'Reservation failed';
        return NextResponse.json({ error: msg }, { status: 409 });
      }
    }

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUrl = `${appBaseUrl}/payments/callback?orderId=${order.id}`;
    console.log('[Payment Init] Redirect URL:', redirectUrl);

    const paymentPayload = {
      tx_ref: String(order.id),
      amount: quote.total,
      currency: 'XOF',
      email: validatedData.email,
      phone_number: validatedData.phone,
      customer_name: validatedData.customerName || `${body.firstName || ''} ${body.lastName || ''}`.trim() || 'Client',
      redirect_url: redirectUrl,
    } as any;
    
    console.log('[Payment Init] Payment payload:', JSON.stringify(paymentPayload, null, 2));
    const paymentResponse = await initializePayment(paymentPayload);
    console.log('[Payment Init] Payment response:', JSON.stringify(paymentResponse, null, 2));
    
    const paymentLink = paymentResponse.data?.link;
    if (!paymentLink) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Payment link missing';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    if (idemRedisKey) {
      await redis.set(idemRedisKey, JSON.stringify({ orderId: order.id, paymentLink, reference: paymentResponse.data?.reference }), { ex: 900 });
    }

    return NextResponse.json(
      { success: true, paymentLink, reference: paymentResponse.data?.reference, orderId: order.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    // Log detailed error response from Flutterwave if available
    if (error.response?.data) {
      // eslint-disable-next-line no-console
      console.error('[Payment Init] Flutterwave response:', error.response.data);
    }
    if (error.response?.status) {
      // eslint-disable-next-line no-console
      console.error('[Payment Init] Flutterwave status:', error.response.status);
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'initialisation du paiement' },
      { status: 500 }
    );
  }
}
