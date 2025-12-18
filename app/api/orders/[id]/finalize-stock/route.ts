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
      .is('finalized_at', null);

    if (fetchError) throw fetchError;

    if (!reservations || reservations.length === 0) {
      return NextResponse.json(
        { error: 'No reservations found' },
        { status: 404 }
      );
    }

    // Finaliser toutes les réservations (cela décrémentera automatiquement le stock via le trigger)
    const now = new Date().toISOString();
    const { error: finalizeError } = await supabase
      .from('stock_reservations')
      .update({ finalized_at: now })
      .eq('order_id', orderId)
      .is('finalized_at', null);

    if (finalizeError) throw finalizeError;

    return NextResponse.json({
      success: true,
      message: 'Stock reservations finalized',
      reservations_count: reservations.length,
    });
  } catch (error: any) {
    console.error('[Finalize Stock] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to finalize stock' },
      { status: 500 }
    );
  }
}
