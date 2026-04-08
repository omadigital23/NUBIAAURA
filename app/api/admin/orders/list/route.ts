import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/orders/list
 * Récupère les commandes avec pagination, recherche et filtres (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false;

    const offset = (page - 1) * limit;

    const supabase = getSupabaseServerClient();

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        total,
        status,
        payment_status,
        shipping_method,
        shipping_address,
        delivery_duration_days,
        shipped_at,
        estimated_delivery_date,
        delivered_at,
        tracking_number,
        carrier,
        created_at,
        updated_at,
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
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus);
    }
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,shipping_address->>email.ilike.%${search}%`);
    }

    // Apply sort and pagination
    const validSortColumns = ['created_at', 'total', 'status', 'order_number'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    query = query
      .order(sortColumn, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      console.error('[list] Error fetching orders:', ordersError);
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        orders: orders || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching orders:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
