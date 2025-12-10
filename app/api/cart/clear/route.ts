import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // ✅ AUTHENTIFICATION OBLIGATOIRE
    const authHeader = request.cookies.get('sb-auth-token');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.value);
    if (authError || !user) {
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
