import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Orders API] Fetching order:', id);

    // Get token from cookie or Authorization header
    let token = request.cookies.get('sb-auth-token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    let userId: string | null = null;
    let isPublicAccess = false;

    if (token) {
      try {
        // Create a client with the token to get the authenticated user
        const userSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );

        const { data: { user }, error: userError } = await userSupabase.auth.getUser();
        if (!userError && user) {
          userId = user.id;
          console.log('[Orders API] Authenticated user:', userId);
        } else {
          console.warn('[Orders API] Auth error (token may be expired):', userError?.message);
          // Token is invalid/expired - allow public access
          isPublicAccess = true;
        }
      } catch (e) {
        console.error('[Orders API] Error getting user:', e);
        isPublicAccess = true;
      }
    } else {
      console.log('[Orders API] No token found - allowing public access');
      isPublicAccess = true;
    }

    // Build query
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          products (
            name,
            image_url
          )
        )
      `
      )
      .eq('id', id);

    // If authenticated, verify ownership
    if (userId && !isPublicAccess) {
      query = query.eq('user_id', userId);
    }

    const { data: order, error } = await query.single();

    if (error) {
      console.error('[Orders API] Query error:', error);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order) {
      console.error('[Orders API] Order not found for ID:', id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // For public access, sanitize sensitive data
    if (isPublicAccess) {
      console.log('[Orders API] Public access - returning order with limited data');
      // Remove user_id for privacy, but keep shipping address for confirmation
      const sanitizedOrder = {
        ...order,
        user_id: undefined,
      };
      return NextResponse.json({ order: sanitizedOrder, isPublicAccess: true }, { status: 200 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

