import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendOrderConfirmationEmail, notifyManagerEmail } from '@/lib/sendgrid';
import { Redis } from '@upstash/redis';
import { getTranslations, getTranslationKey } from '@/lib/i18n';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify Flutterwave webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY!)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const locale: 'fr' | 'en' = 'fr';
    const commonNs = await getTranslations(locale, 'common');
    // Get signature from header
    const signature = request.headers.get('verif-hash');
    if (!signature) {
      const msg = getTranslationKey(commonNs, 'common.error') || 'Missing signature';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Get raw body
    const body = await request.text();

    // Verify signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      const msg = getTranslationKey(commonNs, 'common.error') || 'Invalid signature';
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // Parse body
    const data = JSON.parse(body);

    // Handle webhook event
    if (data.event === 'charge.completed') {
      const { data: paymentData } = data;
      const redis = Redis.fromEnv();
      const idemKey = `fw:webhook:completed:${String(paymentData?.id || paymentData?.tx_ref || '')}`;
      const already = await redis.get(idemKey);
      if (already) {
        console.log(JSON.stringify({ event: 'charge.completed', deduped: true, key: idemKey }));
        return NextResponse.json({ success: true, message: 'Duplicate ignored' }, { status: 200 });
      }

      // Update order
      const { error, data: orderData } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentData.tx_ref)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

      // Finalize reservations for this order
      try {
        await supabase
          .from('stock_reservations')
          .update({ finalized_at: new Date().toISOString() })
          .eq('order_id', paymentData.tx_ref)
          .is('finalized_at', null)
          .is('released_at', null);
        console.log(JSON.stringify({ reservations: 'finalized', orderId: paymentData.tx_ref }));
      } catch (e) {
        console.error('Finalize reservations error:', e);
      }

      // Save idempotency marker before notifications to avoid double sends on retries
      await redis.set(idemKey, JSON.stringify({ orderId: paymentData.tx_ref }), { ex: 3600 });

      // Send notifications (don't fail webhook if notifications fail)
      if (orderData) {
        // Send WhatsApp confirmation to customer (CallMeBot)
        try {
          const customerMessage = `Merci pour votre commande! 🎉\n\nNuméro de commande: ${orderData.id}\nMontant: ${orderData.total.toLocaleString('fr-FR')} FCFA\n\nVous recevrez bientôt des mises à jour sur votre livraison.\n\nNubia Aura`;
          await sendWhatsAppMessage(orderData.phone, customerMessage);
          console.log(JSON.stringify({ notification: 'whatsapp_customer_confirmation', orderId: orderData.id }));
        } catch (error: any) {
          console.error('WhatsApp notification failed:', error.message);
        }

        // Send email confirmation to customer
        try {
          await sendOrderConfirmationEmail(orderData.email, {
            orderId: orderData.id,
            customerName: orderData.customer_name,
            total: orderData.total,
            items: orderData.items || [],
            shippingAddress: `${orderData.address}, ${orderData.city}`,
            estimatedDelivery: '5-7 jours ouvrables',
          });
          console.log(JSON.stringify({ notification: 'email_customer_confirmation', orderId: orderData.id }));
        } catch (error: any) {
          console.error('Email notification failed:', error.message);
        }

        // Send WhatsApp alert to manager (CallMeBot)
        try {
          const managerMessage = `Nouvelle commande reçue! 🎉\n\nCommande: ${orderData.id}\nClient: ${orderData.customer_name}\nMontant: ${orderData.total.toLocaleString('fr-FR')} FCFA\nAdresse: ${orderData.address}, ${orderData.city}`;
          const managerPhone = process.env.MANAGER_WHATSAPP || '+212701193811';
          await sendWhatsAppMessage(managerPhone, managerMessage);
          console.log(JSON.stringify({ notification: 'whatsapp_manager_alert', orderId: orderData.id }));
        } catch (error: any) {
          console.error('Manager WhatsApp notification failed:', error.message);
        }

        // Send email alert to manager
        try {
          await notifyManagerEmail(
            'Nouvelle Commande Reçue',
            `Une nouvelle commande a été reçue et payée.`,
            {
              'ID Commande': orderData.id,
              'Client': orderData.customer_name,
              'Email': orderData.email,
              'Téléphone': orderData.phone,
              'Montant': `${orderData.total.toLocaleString('fr-FR')} FCFA`,
              'Adresse': `${orderData.address}, ${orderData.city}`,
            }
          );
          console.log(JSON.stringify({ notification: 'email_manager_alert', orderId: orderData.id }));
        } catch (error: any) {
          console.error('Manager email notification failed:', error.message);
        }
      }

      return NextResponse.json(
        { success: true, message: 'Webhook processed' },
        { status: 200 }
      );
    }

    if (data.event === 'charge.failed') {
      const { data: paymentData } = data;
      const redis = Redis.fromEnv();
      const idemKey = `fw:webhook:failed:${String(paymentData?.id || paymentData?.tx_ref || '')}`;
      const already = await redis.get(idemKey);
      if (already) {
        console.log(JSON.stringify({ event: 'charge.failed', deduped: true, key: idemKey }));
        return NextResponse.json({ success: true, message: 'Duplicate ignored' }, { status: 200 });
      }

      // Update order
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentData.tx_ref);

      if (error) {
        console.error('Error updating order:', error);
      }

      // Release any active reservations for this order
      try {
        await supabase
          .from('stock_reservations')
          .update({ released_at: new Date().toISOString() })
          .eq('order_id', paymentData.tx_ref)
          .is('finalized_at', null)
          .is('released_at', null);
        console.log(JSON.stringify({ reservations: 'released', orderId: paymentData.tx_ref }));
      } catch (e) {
        console.error('Release reservations error (webhook):', e);
      }

      await redis.set(idemKey, JSON.stringify({ orderId: paymentData.tx_ref }), { ex: 3600 });

      return NextResponse.json(
        { success: true, message: 'Webhook processed' },
        { status: 200 }
      );
    }

    // Unknown event
    return NextResponse.json(
      { success: true, message: 'Event received' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    const locale: 'fr' | 'en' = 'fr';
    const commonNs = await getTranslations(locale, 'common');
    const msg = getTranslationKey(commonNs, 'common.error') || 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
