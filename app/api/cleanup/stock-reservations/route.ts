import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API pour nettoyer les réservations de stock expirées
// Peut être appelée par un cron job ou manuellement

export async function POST(request: NextRequest) {
  try {
    // Vérifier que c'est un appel interne (cron ou admin)
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    
    const validSecret = process.env.CRON_SECRET || 'nubia-cleanup-2024';
    
    if (authHeader !== `Bearer ${process.env.CLEANUP_API_KEY}` && cronSecret !== validSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    // 1. Libérer les réservations expirées non finalisées
    const { data: expiredReservations, error: fetchError } = await supabase
      .from('stock_reservations')
      .select('*')
      .lt('expires_at', now)
      .is('finalized_at', null)
      .is('released_at', null);

    if (fetchError) {
      console.error('[Cleanup] Fetch expired reservations error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (expiredReservations && expiredReservations.length > 0) {
      console.log(`[Cleanup] Found ${expiredReservations.length} expired reservations to release`);

      // Marquer les réservations expirées comme released
      const { error: releaseError } = await supabase
        .from('stock_reservations')
        .update({ 
          released_at: now,
          updated_at: now
        })
        .lt('expires_at', now)
        .is('finalized_at', null)
        .is('released_at', null);

      if (releaseError) {
        console.error('[Cleanup] Release reservations error:', releaseError);
        return NextResponse.json({ error: releaseError.message }, { status: 500 });
      }

      console.log(`[Cleanup] Successfully released ${expiredReservations.length} expired reservations`);
    }

    // 2. Nettoyer les paniers abandonnés (plus de 30 jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: abandonedError } = await supabase
      .from('carts')
      .select('id')
      .lt('updated_at', thirtyDaysAgo);

    if (abandonedError) {
      console.error('[Cleanup] Fetch abandoned carts error:', abandonedError);
      return NextResponse.json({ error: abandonedError.message }, { status: 500 });
    }

    if (abandonedCarts && abandonedCarts.length > 0) {
      const cartIds = abandonedCarts.map(cart => cart.id);

      // Supprimer les items des paniers abandonnés
      const { error: deleteItemsError } = await supabase
        .from('cart_items')
        .delete()
        .in('cart_id', cartIds);

      if (deleteItemsError) {
        console.error('[Cleanup] Delete cart items error:', deleteItemsError);
        return NextResponse.json({ error: deleteItemsError.message }, { status: 500 });
      }

      // Supprimer les paniers abandonnés
      const { error: deleteCartsError } = await supabase
        .from('carts')
        .delete()
        .in('id', cartIds);

      if (deleteCartsError) {
        console.error('[Cleanup] Delete carts error:', deleteCartsError);
        return NextResponse.json({ error: deleteCartsError.message }, { status: 500 });
      }

      console.log(`[Cleanup] Cleaned up ${abandonedCarts.length} abandoned carts`);
    }

    // 3. Statistiques du nettoyage
    const { data: stats, error: statsError } = await supabase
      .from('stock_reservations')
      .select('id, finalized_at, released_at')
      .gte('created_at', thirtyDaysAgo);

    if (statsError) {
      console.error('[Cleanup] Stats error:', statsError);
    }

    const activeReservations = stats?.filter((r: any) => !r.finalized_at && !r.released_at) || [];
    const finalizedReservations = stats?.filter((r: any) => r.finalized_at) || [];

    return NextResponse.json({
      success: true,
      cleaned: {
        expiredReservations: expiredReservations?.length || 0,
        abandonedCarts: abandonedCarts?.length || 0,
      },
      stats: {
        activeReservations: activeReservations.length,
        finalizedReservations: finalizedReservations.length,
        totalReservations: stats?.length || 0,
      },
      timestamp: now,
    });

  } catch (error) {
    console.error('[Cleanup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint GET pour surveillance (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CLEANUP_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Statistiques actuelles
    const { count: expiredCount } = await supabase
      .from('stock_reservations')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', now)
      .is('finalized_at', null)
      .is('released_at', null);

    const { count: abandonedCount } = await supabase
      .from('carts')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', thirtyDaysAgo);

    const { count: activeCount } = await supabase
      .from('stock_reservations')
      .select('*', { count: 'exact', head: true })
      .is('finalized_at', null)
      .is('released_at', null);

    return NextResponse.json({
      stats: {
        expiredReservations: expiredCount || 0,
        abandonedCarts: abandonedCount || 0,
        activeReservations: activeCount || 0,
      },
      timestamp: now,
    });

  } catch (error) {
    console.error('[Cleanup GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
