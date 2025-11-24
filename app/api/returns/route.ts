import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for return requests
const CreateReturnSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  items: z.array(
    z.object({
      product_id: z.string(),
      quantity: z.number().min(1),
      reason: z.string().optional(),
    })
  ).min(1, 'At least one item required'),
  comments: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validated = CreateReturnSchema.parse(body);

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', validated.orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is eligible for return (within 30 days)
    const orderDate = new Date(order.created_at);
    const daysSinceOrder = Math.floor(
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceOrder > 30) {
      return NextResponse.json(
        { error: 'Return window expired (30 days)' },
        { status: 400 }
      );
    }

    // Generate return number
    const returnNumber = `RET-${Date.now()}`;

    // Create return request
    const { data: returnRequest, error: returnError } = await supabase
      .from('returns')
      .insert({
        user_id: user.id,
        order_id: validated.orderId,
        return_number: returnNumber,
        reason: validated.reason,
        comments: validated.comments || null,
        status: 'pending',
        items: validated.items,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (returnError) {
      console.error('Return creation error:', returnError);
      return NextResponse.json(
        { error: 'Failed to create return request' },
        { status: 500 }
      );
    }

    // Send notification to manager
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/returns/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'return_request',
          returnId: returnRequest.id,
          returnNumber,
          orderId: validated.orderId,
          userId: user.id,
          reason: validated.reason,
        }),
      });
    } catch (error) {
      console.error('Notification error:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Return request created successfully',
        return: {
          id: returnRequest.id,
          returnNumber,
          status: returnRequest.status,
          createdAt: returnRequest.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create return error:', error);

    if (error.name === 'ZodError') {
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

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('returns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: returns, error: returnsError } = await query;

    if (returnsError) {
      console.error('Get returns error:', returnsError);
      return NextResponse.json(
        { error: 'Failed to fetch returns' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        returns: returns || [],
        count: returns?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get returns error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
