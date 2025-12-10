import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/orders/list
 * Récupère toutes les commandes (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Vérifier le token admin
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }

    // Récupérer toutes les commandes - Force fresh data from database
    const supabase = getSupabaseServerClient();
    
    // Query with explicit column selection to ensure all fields are returned
    const { data: orders, error: ordersError } = await supabase
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
      `)
      .order('created_at', { ascending: false });
    
    // Log raw data from database for debugging
    const debugOrderId = 'aa86dcc2-f684-4fe6-a205-46a3f21edcaa';
    const debugOrder = orders?.find((o: any) => o.id === debugOrderId);
    if (debugOrder) {
      console.log('[list] DEBUG - Order from database:', {
        id: debugOrder.id,
        delivered_at: debugOrder.delivered_at,
        shipped_at: debugOrder.shipped_at,
        updated_at: debugOrder.updated_at,
        delivered_at_type: typeof debugOrder.delivered_at,
        delivered_at_value: String(debugOrder.delivered_at),
      });
    }

    if (ordersError) {
      console.error('[list] Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: ordersError.message },
        { status: 500 }
      );
    }

    // Log first order to verify data structure
    if (orders && orders.length > 0) {
      console.log('[list] First order sample:', {
        id: orders[0].id,
        delivered_at: orders[0].delivered_at,
        shipped_at: orders[0].shipped_at,
        updated_at: orders[0].updated_at,
      });
    }

    return NextResponse.json(
      {
        success: true,
        orders: orders || [],
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
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
