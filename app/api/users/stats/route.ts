import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/users/stats
 * Récupère les statistiques de l'utilisateur connecté
 * - Total dépensé
 * - Nombre de commandes
 * - Nombre d'adresses sauvegardées
 * - Dernière commande
 * - Commandes par statut
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer les commandes de l'utilisateur
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, created_at, delivered_at, shipped_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    // Récupérer les adresses sauvegardées
    const { data: addresses, error: addressesError } = await supabase
      .from('addresses')
      .select('id, is_default')
      .eq('user_id', user.id);

    if (addressesError) {
      throw addressesError;
    }

    // Calculer les statistiques
    const totalSpent = (orders || []).reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders?.length || 0;
    const totalAddresses = addresses?.length || 0;
    const defaultAddress = addresses?.find(a => a.is_default) || null;

    // Compter les commandes par statut
    const ordersByStatus = {
      pending: (orders || []).filter(o => o.status === 'pending').length,
      processing: (orders || []).filter(o => o.status === 'processing').length,
      shipped: (orders || []).filter(o => o.status === 'shipped').length,
      delivered: (orders || []).filter(o => o.status === 'delivered').length,
      cancelled: (orders || []).filter(o => o.status === 'cancelled').length,
    };

    // Dernière commande
    const lastOrder = orders?.[0] || null;

    // Commandes en cours (non livrées, non annulées)
    const activeOrders = (orders || []).filter(
      o => !['delivered', 'cancelled'].includes(o.status)
    ).length;

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalSpent,
          totalOrders,
          totalAddresses,
          defaultAddress: defaultAddress ? defaultAddress.id : null,
          activeOrders,
          ordersByStatus,
          lastOrder: lastOrder ? {
            id: lastOrder.id,
            total: lastOrder.total,
            status: lastOrder.status,
            created_at: lastOrder.created_at,
            delivered_at: lastOrder.delivered_at,
            shipped_at: lastOrder.shipped_at,
          } : null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
