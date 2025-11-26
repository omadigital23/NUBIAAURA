import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/lib/whatsapp-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron job pour mettre à jour automatiquement les statuts de commandes sur mesure
 * Appelé par QStash selon un calendrier défini
 * 
 * Logique:
 * - J+10 après approbation: Envoyer notification "finition en cours"
 * - J+20 après approbation: status = completed
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CustomOrderStatusCron] Starting custom order status update job');

    // Vérifier le token QStash si disponible
    const qstashSignature = request.headers.get('Upstash-Signature');
    if (process.env.QSTASH_TOKEN && !qstashSignature) {
      console.warn('[CustomOrderStatusCron] Missing QStash signature');
      // En développement, on continue quand même
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

    // Récupérer les commandes qui doivent envoyer notification "finition" (J+10)
    console.log('[CustomOrderStatusCron] Looking for orders needing finalization notification (approved before:', tenDaysAgo.toISOString(), ')');

    const { data: ordersForNotification, error: notifError } = await supabase
      .from('custom_orders')
      .select('id, name, email, phone, status, created_at, finalization_notified_at')
      .eq('status', 'processing')
      .lt('created_at', tenDaysAgo.toISOString())
      .is('finalization_notified_at', null);

    if (notifError) {
      console.error('[CustomOrderStatusCron] Error fetching orders for notification:', notifError);
      throw notifError;
    }

    console.log(`[CustomOrderStatusCron] Found ${ordersForNotification?.length || 0} orders needing finalization notification`);

    // Envoyer notification pour finition en cours
    if (ordersForNotification && ordersForNotification.length > 0) {
      for (const order of ordersForNotification) {
        try {
          // Envoyer WhatsApp au client
          if (order.phone) {
            const message = `🎨 *Votre commande sur mesure est en cours de finition!*\n\n` +
              `Bonjour ${order.name},\n\n` +
              `Votre commande personnalisée est actuellement en phase de finition.\n` +
              `Nous vous enverrons bientôt des photos avant l'expédition.\n\n` +
              `Merci de votre patience!\n\n` +
              `Nubia Aura`;

            try {
              await sendWhatsAppMessage(order.phone, message);
              console.log(`[CustomOrderStatusCron] ✅ Finalization notification sent to ${order.name}`);
            } catch (whatsappErr: any) {
              console.warn(`[CustomOrderStatusCron] Warning: Failed to send WhatsApp to ${order.phone}:`, whatsappErr?.message);
            }
          }

          // Marquer comme notifié
          const { error: updateError } = await supabase
            .from('custom_orders')
            .update({
              finalization_notified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`[CustomOrderStatusCron] Error updating notification status for ${order.id}:`, updateError);
          }
        } catch (err: any) {
          console.error(`[CustomOrderStatusCron] Error processing notification for ${order.id}:`, err);
        }
      }
    }

    // Récupérer les commandes qui doivent passer à "completed" (J+20)
    console.log('[CustomOrderStatusCron] Looking for orders to complete (approved before:', twentyDaysAgo.toISOString(), ')');

    const { data: ordersToComplete, error: completeError } = await supabase
      .from('custom_orders')
      .select('id, name, email, phone, status, created_at')
      .eq('status', 'processing')
      .lt('created_at', twentyDaysAgo.toISOString())
      .is('delivered_at', null);

    if (completeError) {
      console.error('[CustomOrderStatusCron] Error fetching orders to complete:', completeError);
      throw completeError;
    }

    console.log(`[CustomOrderStatusCron] Found ${ordersToComplete?.length || 0} orders to complete`);

    // Mettre à jour les commandes à "completed"
    if (ordersToComplete && ordersToComplete.length > 0) {
      for (const order of ordersToComplete) {
        try {
          const deliveredAt = new Date();

          const { error: updateError } = await supabase
            .from('custom_orders')
            .update({
              status: 'completed',
              delivered_at: deliveredAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`[CustomOrderStatusCron] Error updating order ${order.id}:`, updateError);
          } else {
            console.log(`[CustomOrderStatusCron] ✅ Custom order ${order.id} marked as completed`);

            // Envoyer WhatsApp au client
            if (order.phone) {
              const message = `🎉 *Votre commande sur mesure est prête!*\n\n` +
                `Bonjour ${order.name},\n\n` +
                `Votre commande personnalisée est maintenant prête et en route vers vous!\n` +
                `Vous recevrez bientôt les détails de livraison.\n\n` +
                `Merci d'avoir choisi Nubia Aura!\n\n` +
                `Nubia Aura`;

              try {
                await sendWhatsAppMessage(order.phone, message);
                console.log(`[CustomOrderStatusCron] ✅ Completion notification sent to ${order.name}`);
              } catch (whatsappErr: any) {
                console.warn(`[CustomOrderStatusCron] Warning: Failed to send WhatsApp to ${order.phone}:`, whatsappErr?.message);
              }
            }

            // Ajouter dans delivery_tracking
            try {
              await supabase
                .from('delivery_tracking')
                .insert({
                  order_id: order.id,
                  status: 'completed',
                  notes: 'Commande sur mesure complétée après 20 jours',
                });
            } catch (trackingErr: any) {
              console.warn(`[CustomOrderStatusCron] Warning: Failed to add tracking for ${order.id}:`, trackingErr?.message);
            }
          }
        } catch (err: any) {
          console.error(`[CustomOrderStatusCron] Error processing order ${order.id}:`, err);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        notified: ordersForNotification?.length || 0,
        completed: ordersToComplete?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[CustomOrderStatusCron] Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
