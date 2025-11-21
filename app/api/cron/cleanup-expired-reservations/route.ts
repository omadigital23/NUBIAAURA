import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

/**
 * Cron job pour libérer les réservations de stock expirées
 * À appeler régulièrement (toutes les heures par exemple)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier le token de cron (optionnel mais recommandé)
    const cronToken = request.headers.get('Authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && cronToken !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    // Trouver les réservations expirées qui ne sont pas encore finalisées ou libérées
    const { data: expiredReservations, error: fetchError } = await supabase
      .from('stock_reservations')
      .select('*')
      .lt('expires_at', now)
      .is('finalized_at', null)
      .is('released_at', null);

    if (fetchError) throw fetchError;

    if (!expiredReservations || expiredReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired reservations found',
        count: 0,
      });
    }

    // Libérer toutes les réservations expirées
    const { error: releaseError } = await supabase
      .from('stock_reservations')
      .update({ released_at: now })
      .lt('expires_at', now)
      .is('finalized_at', null)
      .is('released_at', null);

    if (releaseError) throw releaseError;

    console.log(`[Cleanup] Released ${expiredReservations.length} expired reservations`);

    return NextResponse.json({
      success: true,
      message: 'Expired reservations released',
      count: expiredReservations.length,
    });
  } catch (error: any) {
    console.error('[Cleanup Cron] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup expired reservations' },
      { status: 500 }
    );
  }
}
