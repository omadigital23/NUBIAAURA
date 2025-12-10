import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification admin (optionnel pour cette API)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (!verifyAdminToken(token)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const supabase = getSupabaseServerClient();

    // Récupérer toutes les réservations avec statut
    const { data: reservations, error } = await supabase
      .from('stock_reservations')
      .select('id, product_id, qty, expires_at, finalized_at, released_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformer les données pour ajouter le statut
    const transformed = (reservations || []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      qty: r.qty,
      status: r.finalized_at ? 'finalized' : r.released_at ? 'released' : 'active',
      expires_at: r.expires_at,
      created_at: r.created_at,
    }));

    return NextResponse.json({ reservations: transformed });
  } catch (error: any) {
    console.error('[Reservations API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}
