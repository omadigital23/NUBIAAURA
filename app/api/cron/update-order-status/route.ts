import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron job pour mettre à jour automatiquement les statuts de commandes
 * Appelé par QStash selon un calendrier défini
 * 
 * Logique:
 * - J+1 après création: status = shipped
 * - J+3 après shipped: status = delivered
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[OrderStatusCron] Starting order status update job');

    // Vérifier le token QStash si disponible
    const qstashSignature = request.headers.get('Upstash-Signature');
    if (process.env.QSTASH_TOKEN && !qstashSignature) {
      console.warn('[OrderStatusCron] Missing QStash signature');
      // En développement, on continue quand même
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Récupérer les commandes qui doivent passer à "shipped" (J+1)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log('[OrderStatusCron] Looking for orders to ship (created before:', oneDayAgo.toISOString(), ')');

    const { data: ordersToShip, error: shipError } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, delivery_duration_days')
      .eq('status', 'processing')
      .lt('created_at', oneDayAgo.toISOString())
      .is('shipped_at', null);

    if (shipError) {
      console.error('[OrderStatusCron] Error fetching orders to ship:', shipError);
      throw shipError;
    }

    console.log(`[OrderStatusCron] Found ${ordersToShip?.length || 0} orders to ship`);

    // Mettre à jour les commandes à "shipped"
    if (ordersToShip && ordersToShip.length > 0) {
      for (const order of ordersToShip) {
        try {
          const shippedAt = new Date();
          const estimatedDeliveryDate = new Date(shippedAt);
          estimatedDeliveryDate.setDate(
            estimatedDeliveryDate.getDate() + (order.delivery_duration_days || 3)
          );

          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'shipped',
              shipped_at: shippedAt.toISOString(),
              estimated_delivery_date: estimatedDeliveryDate.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`[OrderStatusCron] Error updating order ${order.order_number}:`, updateError);
          } else {
            console.log(`[OrderStatusCron] ✅ Order ${order.order_number} marked as shipped`);

            // Créer entrée dans shipments
            try {
              const carriers = ['DHL', 'FedEx', 'UPS', 'Senegal Post', 'Local'];
              const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];
              const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

              await supabase
                .from('shipments')
                .insert({
                  order_id: order.id,
                  tracking_number: trackingNumber,
                  carrier: randomCarrier,
                  shipped_at: shippedAt.toISOString(),
                  estimated_delivery_at: estimatedDeliveryDate.toISOString(),
                  status: 'in_transit',
                });
              console.log(`[OrderStatusCron] ✅ Shipment created for ${order.order_number} with carrier ${randomCarrier}`);
            } catch (shipmentErr: any) {
              console.warn(`[OrderStatusCron] Warning: Failed to create shipment for ${order.order_number}:`, shipmentErr?.message);
            }

            // Ajouter dans delivery_tracking
            try {
              await supabase
                .from('delivery_tracking')
                .insert({
                  order_id: order.id,
                  status: 'shipped',
                  notes: 'Automatiquement expédié après 1 jour',
                });
            } catch (trackingErr: any) {
              console.warn(`[OrderStatusCron] Warning: Failed to add tracking for ${order.order_number}:`, trackingErr?.message);
            }
          }
        } catch (err: any) {
          console.error(`[OrderStatusCron] Error processing order ${order.order_number}:`, err);
        }
      }
    }

    // Récupérer les commandes qui doivent passer à "delivered" (J+3 après shipped)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    console.log('[OrderStatusCron] Looking for orders to deliver (shipped before:', threeDaysAgo.toISOString(), ')');

    const { data: ordersToDeliver, error: deliverError } = await supabase
      .from('orders')
      .select('id, order_number, status, shipped_at, delivery_duration_days')
      .eq('status', 'shipped')
      .lt('shipped_at', threeDaysAgo.toISOString())
      .is('delivered_at', null);

    if (deliverError) {
      console.error('[OrderStatusCron] Error fetching orders to deliver:', deliverError);
      throw deliverError;
    }

    console.log(`[OrderStatusCron] Found ${ordersToDeliver?.length || 0} orders to deliver`);

    // Mettre à jour les commandes à "delivered"
    if (ordersToDeliver && ordersToDeliver.length > 0) {
      for (const order of ordersToDeliver) {
        try {
          const deliveredAt = new Date();

          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'delivered',
              delivered_at: deliveredAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`[OrderStatusCron] Error updating order ${order.order_number}:`, updateError);
          } else {
            console.log(`[OrderStatusCron] ✅ Order ${order.order_number} marked as delivered`);

            // Ajouter dans delivery_tracking
            try {
              await supabase
                .from('delivery_tracking')
                .insert({
                  order_id: order.id,
                  status: 'delivered',
                  notes: 'Automatiquement livré après 3 jours',
                });
            } catch (trackingErr: any) {
              console.warn(`[OrderStatusCron] Warning: Failed to add tracking for ${order.order_number}:`, trackingErr?.message);
            }
          }
        } catch (err: any) {
          console.error(`[OrderStatusCron] Error processing order ${order.order_number}:`, err);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        shipped: ordersToShip?.length || 0,
        delivered: ordersToDeliver?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[OrderStatusCron] Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
