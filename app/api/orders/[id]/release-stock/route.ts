import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { id: orderId } = await params;

    // Récupérer les réservations de stock pour cette commande
    const { data: reservations, error: fetchError } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('order_id', orderId)
      .is('released_at', null);

    if (fetchError) throw fetchError;

    if (!reservations || reservations.length === 0) {
      return NextResponse.json(
        { error: 'No active reservations found' },
        { status: 404 }
      );
    }

    // Libérer toutes les réservations (cela restaurera automatiquement le stock via le trigger)
    const now = new Date().toISOString();
    const { error: releaseError } = await supabase
      .from('stock_reservations')
      .update({ released_at: now })
      .eq('order_id', orderId)
      .is('released_at', null);

    if (releaseError) throw releaseError;

    return NextResponse.json({
      success: true,
      message: 'Stock reservations released',
      reservations_count: reservations.length,
    });
  } catch (error: any) {
    console.error('[Release Stock] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to release stock' },
      { status: 500 }
    );
  }
}
