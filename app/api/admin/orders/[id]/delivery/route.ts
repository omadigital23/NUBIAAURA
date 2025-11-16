import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { verifyAdminToken } from '@/lib/auth-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema
const UpdateDeliverySchema = z.object({
  delivery_duration_days: z.number().min(1).max(30).optional(),
  shipped_at: z.string().datetime().optional(),
  estimated_delivery_date: z.string().datetime().nullable().optional(),
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
    // Try to get token from Authorization header first, then from cookies
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('sb-auth-token')?.value;
    }
    
    if (!token) {
      console.error('[delivery] No token found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[delivery] Token found, verifying...');
    
    // Try to verify as admin token first
    let isAdmin = verifyAdminToken(token);
    console.log('[delivery] Admin token verification result:', isAdmin);
    
    // If not admin token, try to verify as Supabase token
    if (!isAdmin) {
      console.log('[delivery] Trying Supabase token verification...');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        console.error('[delivery] Supabase auth failed:', userError);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      console.log('[delivery] Supabase auth successful');
      // TODO: Check if user has admin role in database
      isAdmin = true;
    }

    if (!isAdmin) {
      console.error('[delivery] Not admin');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[delivery] Authentication successful, parsing body...');
    const body = await request.json();
    console.log('[delivery] Body:', body);
    
    const validated = UpdateDeliverySchema.parse(body);
    console.log('[delivery] Validated:', validated);

    // Get current order
    console.log('[delivery] Fetching order:', params.id);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      console.error('[delivery] Order not found:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    console.log('[delivery] Order found:', order.id);

    // Calculate estimated delivery date if shipping (only if not manually set)
    let estimatedDeliveryDate = order.estimated_delivery_date;
    // If manually set, use the provided value
    if (validated.estimated_delivery_date !== undefined) {
      estimatedDeliveryDate = validated.estimated_delivery_date;
    } else if (validated.shipped_at && validated.delivery_duration_days) {
      // Otherwise, calculate from shipped_at + duration
      const shippedDate = new Date(validated.shipped_at);
      const deliveryDate = new Date(shippedDate);
      deliveryDate.setDate(deliveryDate.getDate() + validated.delivery_duration_days);
      estimatedDeliveryDate = deliveryDate.toISOString();
    }

    // Update order
    const updateData: any = {};
    if (validated.delivery_duration_days !== undefined) updateData.delivery_duration_days = validated.delivery_duration_days;
    if (validated.shipped_at !== undefined) updateData.shipped_at = validated.shipped_at;
    if (validated.estimated_delivery_date !== undefined) {
      // Handle empty string as null
      updateData.estimated_delivery_date = validated.estimated_delivery_date === '' ? null : validated.estimated_delivery_date;
    } else if (estimatedDeliveryDate) {
      updateData.estimated_delivery_date = estimatedDeliveryDate;
    }
    if (validated.delivered_at !== undefined) updateData.delivered_at = validated.delivered_at;
    if (validated.tracking_number !== undefined) updateData.tracking_number = validated.tracking_number;
    if (validated.carrier !== undefined) updateData.carrier = validated.carrier;
    if (validated.status !== undefined) updateData.status = validated.status;
    
    console.log('[delivery] Updating order with:', updateData);
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[delivery] Update error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    
    console.log('[delivery] Order updated successfully');

    // Add tracking history (optional - table may not exist yet)
    console.log('[delivery] Adding tracking history...');
    try {
      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert({
          order_id: params.id,
          status: validated.status || order.status,
          notes: `Updated by admin: ${JSON.stringify(validated)}`,
        });

      if (trackingError) {
        console.warn('[delivery] Warning: Failed to add tracking history:', trackingError?.message);
        // Don't fail the request if tracking history fails
      } else {
        console.log('[delivery] Tracking history added successfully');
      }
    } catch (trackingErr: any) {
      console.warn('[delivery] Warning: Tracking history error:', trackingErr?.message);
      // Don't fail the request if tracking history fails
    }

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[delivery] Catch error:', error);
    console.error('[delivery] Error stack:', error?.stack);

    if (error instanceof z.ZodError) {
      console.error('[delivery] Zod validation error:', error.errors);
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
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
    // Try to get token from Authorization header first, then from cookies
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('sb-auth-token')?.value;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to verify as admin token first
    let isAdmin = verifyAdminToken(token);
    
    // If not admin token, try to verify as Supabase token
    if (!isAdmin) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // TODO: Check if user has admin role in database
      isAdmin = true;
    }

    if (!isAdmin) {
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
