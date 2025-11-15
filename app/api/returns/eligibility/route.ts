import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * GET /api/returns/eligibility?orderId=xxx
 * Check if an order is eligible for return (within 72 hours of delivery)
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get orderId from query params
    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, delivered_at, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return NextResponse.json(
        {
          eligible: false,
          reason: 'order_not_delivered',
          message: 'La commande n\'a pas encore été livrée',
        },
        { status: 200 }
      );
    }

    // Check if delivered_at exists
    if (!order.delivered_at) {
      return NextResponse.json(
        {
          eligible: false,
          reason: 'no_delivery_date',
          message: 'Date de livraison non enregistrée',
        },
        { status: 200 }
      );
    }

    // Calculate hours since delivery
    const deliveredDate = new Date(order.delivered_at);
    const now = new Date();
    const hoursSinceDelivery = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60);

    // Check if within 72 hours
    if (hoursSinceDelivery > 72) {
      const daysSinceDelivery = Math.floor(hoursSinceDelivery / 24);
      return NextResponse.json(
        {
          eligible: false,
          reason: 'return_window_expired',
          message: `Délai de retour expiré (${daysSinceDelivery} jours depuis la livraison)`,
          hoursSinceDelivery,
        },
        { status: 200 }
      );
    }

    // Calculate remaining time
    const hoursRemaining = 72 - hoursSinceDelivery;
    const returnDeadline = new Date(deliveredDate.getTime() + 72 * 60 * 60 * 1000);

    return NextResponse.json(
      {
        eligible: true,
        hoursSinceDelivery,
        hoursRemaining,
        returnDeadline: returnDeadline.toISOString(),
        deliveredAt: order.delivered_at,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Returns Eligibility] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
