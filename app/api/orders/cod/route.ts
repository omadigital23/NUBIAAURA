import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Redis } from '@upstash/redis';
import { computeQuote, ShippingMethod } from '@/lib/pricing';
import { checkRateLimit, formRatelimit } from '@/lib/rate-limit';
import { getLocaleFromPath, getTranslations, getTranslationKey } from '@/lib/i18n';
import { notifyManagerNewOrder } from '@/lib/whatsapp-notifications';
import { calculateDeliveryDuration } from '@/lib/delivery-calculator';
import { sendOrderConfirmationEmail } from '@/lib/email-service';


export async function POST(request: NextRequest) {
  try {
    const referer = request.headers.get('referer') || '';
    const path = (() => { try { return new URL(referer).pathname; } catch { return referer; } })();
    const locale: 'fr' | 'en' = getLocaleFromPath(path);
    const commonNs = await getTranslations(locale, 'common');
    const productNs = await getTranslations(locale, 'product');

    const origin = request.headers.get('origin') || '';
    const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    if (origin && appBase && origin !== appBase) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Forbidden';
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const rl = await checkRateLimit((() => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'global';
      return `cod:${String(ip).split(',')[0].trim()}`;
    })(), formRatelimit);
    if (!rl.success) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Too many requests';
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    const BodySchema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(8),
      address: z.string().min(1),
      city: z.string().min(1),
      zipCode: z.string().optional(),
      country: z.string().min(1),
      shippingMethod: z.enum(['standard', 'express']).default('standard'),
      items: z.array(z.object({ product_id: z.string().min(1), quantity: z.number().int().positive() })).min(1),
    });

    const body = await request.json();
    console.log('[COD API] Request body:', JSON.stringify(body, null, 2));

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = getTranslationKey(commonNs, 'checkout.errors.missing_fields') || getTranslationKey(commonNs, 'common.error') || 'Invalid request';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

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

    const { items, shippingMethod } = parsed.data;
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, "inStock", product_variants(stock)')
      .in('id', items.map(i => i.product_id));
    if (prodErr) {
      console.error('[COD API] Product fetch error:', prodErr);
      const msg = getTranslationKey(commonNs, 'common.error') || 'Server error';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Consider existing reservations for availability
    const { data: reservations } = await supabase
      .from('stock_reservations')
      .select('product_id, qty, expires_at, finalized_at, released_at')
      .in('product_id', items.map(i => i.product_id));
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
    for (const it of items) {
      const p = products?.find(pr => pr.id === it.product_id);
      if (!p || !p.inStock) {
        const msg = getTranslationKey(productNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const hasVariants = Array.isArray(p.product_variants) && p.product_variants.length > 0;
      const totalStock = hasVariants ? p.product_variants.reduce((s: number, v: any) => s + (v?.stock || 0), 0) : null;
      const alreadyReserved = reservedByProduct.get(it.product_id) || 0;
      if (totalStock !== null && (totalStock - alreadyReserved) < it.quantity) {
        const msg = getTranslationKey(productNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      normalized.push({ product_id: it.product_id, price, quantity: it.quantity });
    }

    const quote = computeQuote({ items: normalized, shippingMethod: shippingMethod as ShippingMethod, country: parsed.data.country });
    console.log('[COD API] Computed quote:', JSON.stringify(quote, null, 2));

    // Redis pour idempotence (optionnel en dev)
    const isDev = process.env.NODE_ENV === 'development';
    const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

    const idemKey = request.headers.get('idempotency-key') || request.headers.get('Idempotency-Key') || null;
    if (idemKey && !isDev && hasRedis) {
      try {
        const redis = Redis.fromEnv();
        const key = `idem:orders:cod:${idemKey}`;
        const existing = await redis.get(key);
        if (existing) {
          const parsedExisting = typeof existing === 'string' ? JSON.parse(existing) : existing;
          return NextResponse.json({ success: true, order: parsedExisting.order }, { status: 200 });
        }
      } catch (err) {
        console.warn('[COD API] Redis idempotence check failed:', err);
        // Continue sans idempotence
      }
    }

    // Calculer delivery_duration_days basé sur le pays
    // Sénégal: 1-3 jours, International: 3-7 jours
    // NOTE: estimated_delivery_date sera calculé lors de la VALIDATION (clic sur "Valider")
    // Le compte à rebours ne commence PAS à la création de la commande
    const deliveryDurationDays = calculateDeliveryDuration(parsed.data.country, false);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: `ORD-${Date.now()}`,
        total: quote.total,
        shipping_address: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          address: parsed.data.address,
          city: parsed.data.city,
          zipCode: parsed.data.zipCode,
          country: parsed.data.country,
        },
        shipping_method: parsed.data.shippingMethod,
        status: 'pending',
        payment_status: 'pending',
        delivery_duration_days: deliveryDurationDays,
        // estimated_delivery_date sera calculé à la validation
      })
      .select('*')
      .single();

    if (orderErr) {
      console.error('[COD API] Order creation error:', orderErr);
      throw orderErr;
    }

    const orderItems = normalized.map(it => ({
      order_id: order.id,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price,
    }));
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) {
      console.error('[COD API] Order items error:', itemsErr);
      throw itemsErr;
    }

    // Create and FINALIZE reservations for COD orders immediately
    // COD orders don't go through payment verification, so we finalize right away
    const ttlMinutes = Number(process.env.PAYMENT_RESERVATION_TTL_MINUTES || 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    const finalizedAt = new Date().toISOString();

    const reservationsPayload = normalized.map(it => ({
      order_id: order.id,
      product_id: it.product_id,
      variant_id: null,
      qty: it.quantity,
      expires_at: expiresAt,
      finalized_at: finalizedAt, // ✅ Finalize immediately for COD to trigger stock decrement
    }));

    if (reservationsPayload.length > 0) {
      const { error: resErr } = await supabase.from('stock_reservations').insert(reservationsPayload as any);
      if (resErr) {
        console.error('[COD API] Stock reservation error:', resErr);
        const msg = getTranslationKey(commonNs, 'common.error') || 'Reservation failed';
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      console.log('[COD API] Stock reservations created and finalized immediately');
    }

    if (idemKey && !isDev && hasRedis) {
      try {
        const redis = Redis.fromEnv();
        const key = `idem:orders:cod:${idemKey}`;
        await redis.set(key, JSON.stringify({ order: { id: order.id, order_number: order.order_number, status: order.status, payment_status: order.payment_status } }), { ex: 900 });
      } catch (err) {
        console.warn('[COD API] Redis idempotence save failed:', err);
        // Continue sans sauvegarder l'idempotence
      }
    }

    // Envoyer notification WhatsApp au manager avec liens de validation (non bloquant)
    try {
      console.log('[COD API] Envoi notification WhatsApp avec détails complets...');
      await notifyManagerNewOrder({
        orderId: order.order_number,
        customerName: `${parsed.data.firstName} ${parsed.data.lastName}`,
        customerEmail: parsed.data.email,
        customerPhone: parsed.data.phone,
        subtotal: quote.subtotal,
        shipping: quote.shipping,
        tax: quote.tax,
        total: quote.total,
        itemCount: normalized.length,
        items: normalized.map(item => {
          const product = products?.find(p => p.id === item.product_id);
          return {
            name: product?.name || 'Produit',
            quantity: item.quantity,
            price: item.price
          };
        }),
        address: parsed.data.address,
        city: parsed.data.city,
        zipCode: parsed.data.zipCode,
        country: parsed.data.country,
        paymentMethod: 'cod'
      });
      console.log('[COD API] Notification WhatsApp envoyée avec succès!');
    } catch (whatsappError) {
      console.error('[COD API] Erreur WhatsApp (non bloquant):', whatsappError);
      // Ne pas bloquer la commande si WhatsApp échoue
    }

    // Envoyer email de confirmation au client (non bloquant)
    try {
      console.log('[COD API] Envoi email de confirmation au client...');
      await sendOrderConfirmationEmail(parsed.data.email, {
        orderNumber: order.order_number,
        orderId: order.id,
        customerName: `${parsed.data.firstName} ${parsed.data.lastName}`,
        total: quote.total,
        items: normalized.map(item => {
          const product = products?.find(p => p.id === item.product_id);
          return {
            name: product?.name || 'Produit',
            quantity: item.quantity,
            price: item.price
          };
        }),
      });
      console.log('[COD API] Email de confirmation envoyé avec succès!');
    } catch (emailError) {
      console.error('[COD API] Erreur email (non bloquant):', emailError);
      // Ne pas bloquer la commande si l'email échoue
    }

    return NextResponse.json(
      { success: true, order: { id: order.id, order_number: order.order_number, status: order.status, payment_status: order.payment_status } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('COD order error:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de la commande' }, { status: 500 });
  }
}
