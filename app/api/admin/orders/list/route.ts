import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

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

    // Récupérer toutes les commandes
    const supabase = getSupabaseServerClient();
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
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
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json(
        { error: ordersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        orders: orders || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
