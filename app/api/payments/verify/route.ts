import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPaymentByReference, verifyPayment, isPaymentSuccessful } from '@/lib/flutterwave';
import { Redis } from '@upstash/redis';
import { getLocaleFromPath, getTranslations, getTranslationKey } from '@/lib/i18n';
import { trackPurchase } from '@/lib/analytics-config';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const referer = request.headers.get('referer') || '';
    const path = (() => { try { return new URL(referer).pathname; } catch { return referer; } })();
    let locale: 'fr' | 'en' = 'fr';
    try { const peek = await request.clone().json(); if (peek?.locale === 'en' || peek?.locale === 'fr') locale = peek.locale; else locale = getLocaleFromPath(path); } catch { locale = getLocaleFromPath(path); }
    const commonNs = await getTranslations(locale, 'common');

    const origin = request.headers.get('origin') || '';
    const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    if (origin && appBase && origin !== appBase) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Forbidden';
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    // Rate limiting removed for payment verification to allow retries
    // The endpoint is protected by origin check above

    const body = await request.json();
    const { reference, orderId: rawOrderId, tx_ref, transaction_id, status } = body;

    // orderId may be absent; if tx_ref was set to order.id at init, use it
    const orderId = rawOrderId || tx_ref || null;

    if (!orderId && !reference && !transaction_id) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Missing verification parameters';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Fetch order to determine payment gateway
    let orderPaymentMethod = 'flutterwave'; // Default/legacy
    let orderPaymentStatus = 'pending';
    if (orderId) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('payment_method, payment_status, status')
        .eq('id', orderId)
        .single();

      if (orderData) {
        orderPaymentMethod = orderData.payment_method || 'flutterwave';
        orderPaymentStatus = orderData.payment_status || 'pending';
      }
    }

    // PayDunya payments are verified via IPN webhook (server-to-server)
    // The callback page just checks the order status
    if (orderPaymentMethod === 'paydunya') {
      console.log('[Payment Verify] PayDunya order detected, checking IPN status');

      // PayDunya IPN has already updated the order status
      if (orderPaymentStatus === 'paid' || orderPaymentStatus === 'completed') {
        // Finalize stock reservations
        try {
          await supabase
            .from('stock_reservations')
            .update({ finalized_at: new Date().toISOString() })
            .eq('order_id', orderId as string)
            .is('finalized_at', null)
            .is('released_at', null);
        } catch (e) {
          console.error('Finalize reservations error (paydunya verify):', e);
        }

        return NextResponse.json({
          success: true,
          message: 'Paiement PayDunya vérifié avec succès',
          paymentStatus: 'completed',
          orderStatus: 'processing'
        }, { status: 200 });
      } else if (orderPaymentStatus === 'failed') {
        return NextResponse.json({
          success: false,
          message: 'Le paiement PayDunya a échoué',
          paymentStatus: 'failed'
        }, { status: 400 });
      } else {
        // Payment still pending - IPN may not have arrived yet
        // Try to verify directly with PayDunya API as fallback
        try {
          const { data: orderData } = await supabase
            .from('orders')
            .select('payment_details')
            .eq('id', orderId)
            .single();

          const paymentToken = orderData?.payment_details?.token || reference;

          if (paymentToken) {
            console.log('[Payment Verify] Checking PayDunya API directly for token:', paymentToken);

            // Import and use PayDunya provider for direct verification
            const { paydunyaProvider } = await import('@/lib/payments');
            const confirmResult = await paydunyaProvider.confirmPayment(paymentToken);

            if (confirmResult.success && confirmResult.status === 'paid') {
              // Update order status since IPN didn't arrive yet
              await supabase
                .from('orders')
                .update({
                  status: 'paid',
                  payment_status: 'paid',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

              // Finalize stock reservations
              try {
                await supabase
                  .from('stock_reservations')
                  .update({ finalized_at: new Date().toISOString() })
                  .eq('order_id', orderId as string)
                  .is('finalized_at', null)
                  .is('released_at', null);
              } catch (e) {
                console.error('Finalize reservations error (paydunya direct verify):', e);
              }

              return NextResponse.json({
                success: true,
                message: 'Paiement PayDunya vérifié avec succès',
                paymentStatus: 'completed',
                orderStatus: 'processing'
              }, { status: 200 });
            }
          }
        } catch (directVerifyError) {
          console.warn('[Payment Verify] Direct PayDunya verification failed:', directVerifyError);
        }

        // Return pending status so frontend can retry
        return NextResponse.json({
          success: false,
          message: 'Paiement PayDunya en attente de confirmation. Veuillez patienter.',
          paymentStatus: orderPaymentStatus,
          isPending: true
        }, { status: 202 });
      }
    }

    // Flutterwave flow (legacy)
    // Verify payment with Flutterwave (prefer transaction_id, then reference, then tx_ref)
    let verificationData: any | null = null;
    try {
      if (transaction_id) {
        verificationData = await verifyPayment(String(transaction_id));
      } else if (reference) {
        verificationData = await verifyPaymentByReference(String(reference));
      } else if (tx_ref) {
        verificationData = await verifyPaymentByReference(String(tx_ref));
      }
    } catch (e: any) {
      // If verify_by_reference fails and we only have tx_ref, fall back to marking by provided status
      verificationData = null;
    }

    // Determine success
    let isSuccessful = false;
    if (verificationData) {
      isSuccessful = isPaymentSuccessful(verificationData);
    } else if (typeof status === 'string') {
      // Fallback from provider redirect status
      isSuccessful = status.toLowerCase() === 'successful' || status.toLowerCase() === 'success';
    }

    const redis = Redis.fromEnv();
    const idemKey = `fw:verify:${String(transaction_id || reference || orderId || tx_ref)}`;
    const cached = await redis.get(idemKey);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return NextResponse.json(parsed, { status: parsed?.success ? 200 : 400 });
    }

    if (isSuccessful) {
      // Update order payment status in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId as string);

      if (updateError) {
        console.error('Error updating order:', updateError);
      }

      // Finalize active reservations for this order (idempotent)
      try {
        await supabase
          .from('stock_reservations')
          .update({ finalized_at: new Date().toISOString() })
          .eq('order_id', orderId as string)
          .is('finalized_at', null)
          .is('released_at', null);
      } catch (e) {
        console.error('Finalize reservations error (verify):', e);
      }

      // Track purchase in analytics
      try {
        // Fetch order details for accurate tracking
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, order_items(product_id, quantity, price, products(name))')
          .eq('id', orderId as string)
          .single();

        if (orderData) {
          const orderItems = (orderData.order_items || []).map((item: any) => ({
            id: item.product_id,
            name: item.products?.name || 'Product',
            price: item.price,
            quantity: item.quantity,
          }));

          trackPurchase({
            transaction_id: orderId as string,
            value: orderData.total || 0,
            tax: 0, // Can be calculated from total if needed
            shipping: orderData.shipping_cost || 0,
            items: orderItems,
          });
        }
      } catch (e) {
        console.error('Analytics tracking error:', e);
      }

      const payload = { success: true, message: 'Paiement vérifié avec succès', paymentStatus: 'completed', orderStatus: 'processing' };
      await redis.set(idemKey, JSON.stringify(payload), { ex: 900 });
      return NextResponse.json(payload, { status: 200 });
    } else {
      // Update order with failed payment
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId as string);

      if (updateError) {
        console.error('Error updating order:', updateError);
      }

      // Release active reservations for this order (idempotent)
      try {
        await supabase
          .from('stock_reservations')
          .update({ released_at: new Date().toISOString() })
          .eq('order_id', orderId as string)
          .is('finalized_at', null)
          .is('released_at', null);
      } catch (e) {
        console.error('Release reservations error (verify):', e);
      }

      const payload = { success: false, message: 'Le paiement n\'a pas été complété', paymentStatus: verificationData?.data?.status || status || 'failed' };
      await redis.set(idemKey, JSON.stringify(payload), { ex: 900 });
      return NextResponse.json(payload, { status: 400 });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);

    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: { route: 'payments/verify' },
    });

    // Update order with error status
    let bodyAgain: any = {};
    try { bodyAgain = await request.json(); } catch { }
    const orderId = bodyAgain?.orderId || bodyAgain?.tx_ref;
    if (orderId) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId as string);
    }

    return NextResponse.json({ error: error.message || 'Erreur lors de la vérification du paiement' }, { status: 500 });
  }
}
