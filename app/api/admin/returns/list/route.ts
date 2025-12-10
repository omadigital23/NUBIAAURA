import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/returns/list
 * Récupère toutes les demandes de retour (admin only)
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

    // Récupérer toutes les demandes de retour
    const supabase = getSupabaseServerClient();
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .select(`
        *,
        orders (
          id,
          order_number,
          delivered_at
        )
      `)
      .order('created_at', { ascending: false });

    if (returnsError) {
      return NextResponse.json(
        { error: returnsError.message },
        { status: 500 }
      );
    }

    // Enrichir les données avec le temps écoulé depuis la livraison
    const enrichedReturns = (returns || []).map((ret: any) => {
      let hoursSinceDelivery = null;
      if (ret.orders?.delivered_at) {
        const deliveredDate = new Date(ret.orders.delivered_at).getTime();
        const now = new Date().getTime();
        hoursSinceDelivery = Math.floor((now - deliveredDate) / (1000 * 60 * 60));
      }

      return {
        ...ret,
        order_number: ret.orders?.order_number,
        delivered_at: ret.orders?.delivered_at,
        hours_since_delivery: hoursSinceDelivery,
      };
    });

    return NextResponse.json(
      {
        success: true,
        returns: enrichedReturns,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
