import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // ✅ AUTHENTIFICATION OBLIGATOIRE - Check both cookie and header
    const authCookie = request.cookies.get('sb-auth-token')?.value;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authCookie;

    if (!token) {
      console.log('[Clear Cart API] No auth token found');
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log('[Clear Cart API] Invalid auth:', authError?.message);
      return NextResponse.json(
        { error: 'Invalid authentication', code: 'AUTH_INVALID' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Récupérer le panier
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      console.error('[Clear Cart API] Cart error:', cartError);
      return NextResponse.json({ error: cartError.message }, { status: 500 });
    }

    // Si pas de panier, c'est OK (déjà vide)
    if (!cart) {
      return NextResponse.json({ success: true, message: 'Cart already empty' });
    }

    // Supprimer tous les items du panier
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      console.error('[Clear Cart API] Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('[Clear Cart API] Cart cleared for user:', userId);
    return NextResponse.json({ success: true, message: 'Cart cleared successfully' });

  } catch (error) {
    console.error('[Clear Cart API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
