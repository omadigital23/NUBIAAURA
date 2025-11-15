import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema
const UpdateDeliverySchema = z.object({
  delivery_duration_days: z.number().min(1).max(30).optional(),
  shipped_at: z.string().datetime().optional(),
  delivered_at: z.string().datetime().optional(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
});

/**
 * PUT /api/admin/orders/[id]/delivery
 * Update order delivery information (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check
    // For now, assuming authenticated user is admin

    const body = await request.json();
    const validated = UpdateDeliverySchema.parse(body);

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate estimated delivery date if shipping
    let estimatedDeliveryDate = order.estimated_delivery_date;
    if (validated.shipped_at && validated.delivery_duration_days) {
      const shippedDate = new Date(validated.shipped_at);
      const deliveryDate = new Date(shippedDate);
      deliveryDate.setDate(deliveryDate.getDate() + validated.delivery_duration_days);
      estimatedDeliveryDate = deliveryDate.toISOString();
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_duration_days: validated.delivery_duration_days || order.delivery_duration_days,
        shipped_at: validated.shipped_at || order.shipped_at,
        estimated_delivery_date: estimatedDeliveryDate,
        delivered_at: validated.delivered_at || order.delivered_at,
        tracking_number: validated.tracking_number || order.tracking_number,
        carrier: validated.carrier || order.carrier,
        status: validated.status || order.status,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Add tracking history
    const { error: trackingError } = await supabase
      .from('delivery_tracking')
      .insert({
        order_id: params.id,
        status: validated.status || order.status,
        notes: `Updated by admin: ${JSON.stringify(validated)}`,
      });

    if (trackingError) {
      console.error('Failed to add tracking history:', trackingError);
    }

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update delivery error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[id]/delivery
 * Get order delivery information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get order with delivery info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        delivery_duration_days,
        shipped_at,
        estimated_delivery_date,
        delivered_at,
        tracking_number,
        carrier,
        created_at
      `)
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get delivery tracking history
    const { data: tracking, error: trackingError } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('order_id', params.id)
      .order('status_date', { ascending: false });

    if (trackingError) {
      console.error('Failed to fetch tracking history:', trackingError);
    }

    return NextResponse.json(
      {
        order,
        tracking: tracking || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get delivery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
