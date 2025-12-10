import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user's wishlist
export async function GET(request: NextRequest) {
    try {
        // Get user from auth token
        const token = request.cookies.get('sb-auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Get or create default wishlist for user
        let { data: wishlist } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', 'default')
            .single();

        if (!wishlist) {
            // Create default wishlist
            const { data: newWishlist, error: createError } = await supabase
                .from('wishlists')
                .insert({ user_id: user.id, name: 'default' })
                .select('id')
                .single();

            if (createError) {
                console.error('Wishlist creation error:', createError);
                return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
            }
            wishlist = newWishlist;
        }

        // Get wishlist items with product details
        const { data: items, error } = await supabase
            .from('wishlist_items')
            .select(`
        id,
        created_at,
        product_id,
        products (
          id,
          name,
          price,
          image,
          slug,
          "inStock"
        )
      `)
            .eq('wishlist_id', wishlist.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Wishlist fetch error:', error);
            return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            items: items || [],
            count: items?.length || 0
        });

    } catch (error: any) {
        console.error('Wishlist error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Add to wishlist
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('sb-auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { productId } = await request.json();
        if (!productId) {
            return NextResponse.json({ error: 'Product ID requis' }, { status: 400 });
        }

        // Get or create default wishlist
        let { data: wishlist } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', 'default')
            .single();

        if (!wishlist) {
            const { data: newWishlist, error } = await supabase
                .from('wishlists')
                .insert({ user_id: user.id, name: 'default' })
                .select('id')
                .single();

            if (error) throw error;
            wishlist = newWishlist;
        }

        // Check if already in wishlist
        const { data: existing } = await supabase
            .from('wishlist_items')
            .select('id')
            .eq('wishlist_id', wishlist.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                message: 'Déjà dans la liste de souhaits',
                alreadyExists: true
            });
        }

        // Add to wishlist
        const { error } = await supabase
            .from('wishlist_items')
            .insert({ wishlist_id: wishlist.id, product_id: productId });

        if (error) {
            console.error('Wishlist insert error:', error);
            return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Ajouté à la liste de souhaits'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Wishlist add error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove from wishlist
export async function DELETE(request: NextRequest) {
    try {
        const token = request.cookies.get('sb-auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID requis' }, { status: 400 });
        }

        // Get user's wishlist
        const { data: wishlist } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', 'default')
            .single();

        if (!wishlist) {
            return NextResponse.json({ success: true, message: 'Wishlist vide' });
        }

        const { error } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('wishlist_id', wishlist.id)
            .eq('product_id', productId);

        if (error) {
            console.error('Wishlist delete error:', error);
            return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Retiré de la liste de souhaits'
        });

    } catch (error: any) {
        console.error('Wishlist remove error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
