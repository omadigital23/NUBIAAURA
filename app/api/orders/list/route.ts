import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification - Support Authorization header et cookie
    let token: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else {
      token = request.cookies.get('sb-auth-token')?.value || null;
    }

    // Allow a dev-only debug path to fetch orders for an arbitrary user id
    // Usage: /api/orders/list?debug_user_id=<uuid> (only in non-production)
    const url = new URL(request.url);
    const debugUserId = url.searchParams.get('debug_user_id');

    const supabase = getSupabaseServerClient();

    let resolvedUserId: string | null = null;

    if (debugUserId && process.env.NODE_ENV !== 'production') {
      console.warn('[orders/list] DEBUG MODE: returning orders for debug_user_id=', debugUserId);
      resolvedUserId = debugUserId;
    } else {
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          {
            status: 401,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              Pragma: 'no-cache',
              Expires: '0',
            },
          }
        );
      }

      // Récupérer l'utilisateur
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      resolvedUserId = user.id;
    }

    // Récupérer les commandes de l'utilisateur avec leurs items
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
      .eq('user_id', resolvedUserId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json(
        { error: ordersError.message },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Debug log to help trace which user requested orders and how many were found
    try {
      console.log(`[orders/list] user=${resolvedUserId} ordersCount=${(orders || []).length}`);
    } catch (e) {
      // ignore logging errors
    }

    return NextResponse.json(
      {
        success: true,
        orders: orders || [],
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
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
