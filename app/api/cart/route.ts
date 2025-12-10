import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cartRateLimit, getClientIdentifier, addRateLimitHeaders } from '@/lib/rate-limit-upstash';
import * as Sentry from '@sentry/nextjs';

const CartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().positive(),
  image: z.string(),
});

const CartSchema = z.object({
  action: z.enum(['add', 'remove', 'update', 'get', 'clear']),
  item: CartItemSchema.optional(),
  user_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    if (cartRateLimit) {
      const identifier = getClientIdentifier(request);
      const { success, limit, remaining, reset } = await cartRateLimit.limit(identifier);

      if (!success) {
        console.warn(`[Cart] Rate limit exceeded for ${identifier}`);

        const response = NextResponse.json(
          {
            error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          { status: 429 }
        );

        addRateLimitHeaders(response.headers, { limit, remaining, reset });
        return response;
      }

      const response = await handleCartRequest(request);
      addRateLimitHeaders(response.headers, { limit, remaining, reset });
      return response;
    }

    return await handleCartRequest(request);
  } catch (error: any) {
    console.error('[Cart] Error:', error);
    Sentry.captureException(error, {
      tags: { route: 'cart' },
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la gestion du panier' },
      { status: 500 }
    );
  }
}

async function handleCartRequest(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = CartSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ AUTHENTIFICATION OBLIGATOIRE
    let userId: string | null = null;

    // Try to get token from Authorization header first, then from cookie
    let token: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else {
      const cookieToken = request.cookies.get('sb-auth-token');
      token = cookieToken?.value || null;
    }

    console.log('[Cart API] Token from Authorization header:', !!authHeader);
    console.log('[Cart API] Token from cookie:', !!request.cookies.get('sb-auth-token'));
    console.log('[Cart API] Final token present:', !!token);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[Cart API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication', code: 'AUTH_INVALID' },
        { status: 401 }
      );
    }

    userId = user.id;

    if (parsed.action === 'get') {
      // Récupérer ou créer le panier
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (cartError && cartError.code !== 'PGRST116') {
        console.error('[Cart API] Cart error:', cartError);
        return NextResponse.json({ error: cartError.message }, { status: 500 });
      }

      let cartId = cart?.id;
      if (!cart) {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({
            user_id: userId
          })
          .select('id')
          .single();

        if (newCartError) {
          console.error('[Cart API] Create cart error:', newCartError);
          return NextResponse.json({ error: newCartError.message }, { status: 500 });
        }
        cartId = newCart.id;
      }

      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          *,
          products(id, name, name_fr, name_en, price, image, inStock)
        `)
        .eq('cart_id', cartId);

      if (itemsError) {
        console.error('[Cart API] Items error:', itemsError);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }

      // Transformer les items pour correspondre au format attendu par le frontend
      const transformedItems = items?.map(item => ({
        id: item.product_id,
        name: item.products?.name_fr || item.products?.name || 'Produit',
        price: Number(item.products?.price || item.price),
        quantity: item.quantity,
        image: item.products?.image || item.image || '',
      })) || [];

      return NextResponse.json({ items: transformedItems });
    }

    if (parsed.action === 'add' && parsed.item) {
      // Vérifier que le produit existe et est en stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, inStock, name, name_fr, name_en, price, image, stock')
        .eq('id', parsed.item.id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      if (!product.inStock) {
        return NextResponse.json(
          { error: 'Product out of stock' },
          { status: 400 }
        );
      }

      // Récupérer ou créer le panier
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

      let cartId = cart?.id;
      if (!cart) {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({
            user_id: userId
          })
          .select('id')
          .single();

        if (newCartError) {
          return NextResponse.json({ error: newCartError.message }, { status: 500 });
        }
        cartId = newCart.id;
      }

      // Vérifier si l'item existe déjà dans le panier
      const { data: existingItem, error: existingError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', parsed.item.id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('[Cart API] Existing item error:', existingError);
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }

      if (existingItem) {
        // Mettre à jour la quantité
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + parsed.item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      } else {
        // Ajouter le nouvel item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: parsed.item.id,
            quantity: parsed.item.quantity,
            price: parsed.item.price,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }

      // NOTE: Stock is NOT decremented here anymore
      // Stock reservations are created at checkout time instead
      // This allows users to abandon carts without losing stock

      // Retourner l'item mis à jour
      const transformedItem = {
        id: parsed.item.id,
        name: product.name_fr || product.name || 'Produit',
        price: Number(product.price),
        quantity: existingItem ? existingItem.quantity + parsed.item.quantity : parsed.item.quantity,
        image: product.image || parsed.item.image,
      };

      return NextResponse.json({ success: true, item: transformedItem });
    }

    if (parsed.action === 'remove' && parsed.item) {
      // Récupérer le panier et l'item à supprimer
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      // Supprimer l'item du panier
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id)
        .eq('product_id', parsed.item.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      // NOTE: Stock restoration is NOT needed here
      // Stock was never decremented from cart, only reserved at checkout

      return NextResponse.json({ success: true });
    }

    if (parsed.action === 'update' && parsed.item) {
      // Vérifier que le produit existe
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, inStock')
        .eq('id', parsed.item.id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      if (!product.inStock) {
        return NextResponse.json(
          { error: 'Product out of stock' },
          { status: 400 }
        );
      }

      // Récupérer le panier
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      if (parsed.item.quantity <= 0) {
        // Si quantité = 0, supprimer l'item
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id)
          .eq('product_id', parsed.item.id);

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
      } else {
        // Mettre à jour la quantité
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: parsed.item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('cart_id', cart.id)
          .eq('product_id', parsed.item.id);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      }

      // Retourner l'item mis à jour
      const transformedItem = {
        id: parsed.item.id,
        name: parsed.item.name,
        price: parsed.item.price,
        quantity: parsed.item.quantity,
        image: parsed.item.image,
      };

      return NextResponse.json({ success: true, item: transformedItem });
    }

    if (parsed.action === 'clear') {
      // Récupérer le panier
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      // Supprimer tous les items du panier
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[Cart API] Error:', error);
    throw error; // Re-throw to be caught by outer handler
  }
}