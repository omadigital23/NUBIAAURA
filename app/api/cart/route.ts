import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cartRateLimit, getClientIdentifier, addRateLimitHeaders } from '@/lib/rate-limit-upstash';
import * as Sentry from '@sentry/nextjs';

const AddItemSchema = z.object({
  id: z.string(),
  variantId: z.string().uuid().nullable().optional(),
  variant_id: z.string().uuid().nullable().optional(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().positive(),
  image: z.string(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

const RemoveItemSchema = z.object({
  id: z.string(),
  variantId: z.string().uuid().nullable().optional(),
  variant_id: z.string().uuid().nullable().optional(),
});

const UpdateItemSchema = z.object({
  id: z.string(),
  variantId: z.string().uuid().nullable().optional(),
  variant_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int(),
  name: z.string().optional(),
  price: z.number().optional(),
  image: z.string().optional(),
});

const CartSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), item: AddItemSchema, user_id: z.string().uuid().optional() }),
  z.object({ action: z.literal('remove'), item: RemoveItemSchema, user_id: z.string().uuid().optional() }),
  z.object({ action: z.literal('update'), item: UpdateItemSchema, user_id: z.string().uuid().optional() }),
  z.object({ action: z.literal('get'), item: z.unknown().optional(), user_id: z.string().uuid().optional() }),
  z.object({ action: z.literal('clear'), item: z.unknown().optional(), user_id: z.string().uuid().optional() }),
]);

type CartVariantInput = {
  variantId?: string | null;
  variant_id?: string | null;
  size?: string | null;
  color?: string | null;
};

type ProductVariantRecord = {
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number | string | null;
  stock?: number | null;
  image?: string | null;
};

function getRequestedVariantId(item: CartVariantInput) {
  return item.variantId || item.variant_id || null;
}

function withVariantFilter(query: any, variantId?: string | null) {
  return variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null);
}

function findRequestedVariant(variants: ProductVariantRecord[], item: CartVariantInput) {
  if (!variants.length) return null;

  const requestedVariantId = getRequestedVariantId(item);
  if (requestedVariantId) {
    return variants.find((variant) => variant.id === requestedVariantId) || null;
  }

  if (item.size || item.color) {
    return variants.find((variant) => {
      const sizeMatches = !item.size || variant.size === item.size;
      const colorMatches = !item.color || variant.color === item.color;
      return sizeMatches && colorMatches;
    }) || null;
  }

  return variants.length === 1 ? variants[0] : null;
}

export async function GET(request: NextRequest) {
  return handleCartRoute(request, { action: 'get' });
}

export async function POST(request: NextRequest) {
  return handleCartRoute(request);
}

async function handleCartRoute(request: NextRequest, bodyOverride?: unknown) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Cart] Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let rateLimitHeaders: { limit: number; remaining: number; reset: number } | null = null;

    // Rate limiting check
    if (cartRateLimit) {
      try {
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

        rateLimitHeaders = { limit, remaining, reset };
      } catch (rateLimitError) {
        console.warn('[Cart] Rate limiting failed, continuing without it:', rateLimitError);
      }
    }

    const response = await handleCartRequest(request, bodyOverride);

    if (rateLimitHeaders) {
      addRateLimitHeaders(response.headers, rateLimitHeaders);
    }

    return response;

  } catch (error: unknown) {
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

async function handleCartRequest(request: NextRequest, bodyOverride?: unknown) {
  try {
    const body = bodyOverride ?? await readJsonBody(request);
    const parsedResult = CartSchema.safeParse(body);

    if (!parsedResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsedResult.error.errors },
        { status: 400 }
      );
    }

    const parsed = parsedResult.data;

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

    // console.log('[Cart API] Token checks...', { hasHeader: !!authHeader, hasCookie: !!request.cookies.get('sb-auth-token') });

    if (!token) {
      if (parsed.action === 'get') {
        return NextResponse.json({ items: [] });
      }

      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      // console.error('[Cart API] Auth error:', authError);
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
          products(id, name, name_fr, name_en, price, image_url, inStock),
          product_variants(id, size, color, price, stock, image)
        `)
        .eq('cart_id', cartId);

      if (itemsError) {
        console.error('[Cart API] Items error:', itemsError);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }

      // Transformer les items pour correspondre au format attendu par le frontend
      const transformedItems = items?.map(item => ({
        id: item.product_id,
        variantId: item.variant_id || null,
        name: item.products?.name_fr || item.products?.name || 'Produit',
        price: Number(item.product_variants?.price ?? item.products?.price ?? item.price),
        quantity: item.quantity,
        image: item.product_variants?.image || item.products?.image_url || item.image || '',
        size: item.product_variants?.size || null,
        color: item.product_variants?.color || null,
      })) || [];

      return NextResponse.json({ items: transformedItems });
    }

    if (parsed.action === 'add') {
      const item = parsed.item;

      // Vérifier que le produit existe et est en stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, inStock, name, name_fr, name_en, price, image_url, stock, product_variants(id, size, color, price, stock, image)')
        .eq('id', item.id)
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
      const variants = Array.isArray(product.product_variants)
        ? product.product_variants as ProductVariantRecord[]
        : [];
      const selectedVariant = findRequestedVariant(variants, item);

      if (variants.length > 0 && !selectedVariant) {
        return NextResponse.json(
          { error: 'Variant selection required' },
          { status: 400 }
        );
      }

      const variantId = selectedVariant?.id || null;
      const unitPrice = Number(selectedVariant?.price ?? product.price ?? item.price);
      const itemImage = selectedVariant?.image || product.image_url || item.image;

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
      let existingItemQuery = supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', item.id);
      existingItemQuery = withVariantFilter(existingItemQuery, variantId);
      const { data: existingItem, error: existingError } = await existingItemQuery.single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('[Cart API] Existing item error:', existingError);
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }

      const requestedQuantity = (existingItem?.quantity || 0) + item.quantity;
      const availableStock = variants.length > 0
        ? Number(selectedVariant?.stock || 0)
        : typeof product.stock === 'number'
          ? product.stock
          : null;

      if (availableStock !== null && requestedQuantity > availableStock) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        );
      }

      if (existingItem) {
        // Mettre à jour la quantité
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: requestedQuantity,
            price: unitPrice,
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
            product_id: item.id,
            variant_id: variantId,
            quantity: item.quantity,
            price: unitPrice,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }

      // Retourner l'item mis à jour
      const transformedItem = {
        id: item.id,
        variantId,
        name: product.name_fr || product.name || 'Produit',
        price: unitPrice,
        quantity: requestedQuantity,
        image: itemImage,
        size: selectedVariant?.size || item.size || null,
        color: selectedVariant?.color || item.color || null,
      };

      return NextResponse.json({ success: true, item: transformedItem });
    }

    if (parsed.action === 'remove') {
      const item = parsed.item;
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
      let deleteQuery = supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id)
        .eq('product_id', item.id);
      deleteQuery = withVariantFilter(deleteQuery, getRequestedVariantId(item));
      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (parsed.action === 'update') {
      const item = parsed.item;
      // Vérifier que le produit existe
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, inStock, stock, product_variants(id, size, color, price, stock, image)')
        .eq('id', item.id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      const variants = Array.isArray(product.product_variants)
        ? product.product_variants as ProductVariantRecord[]
        : [];
      const selectedVariant = findRequestedVariant(variants, item);
      const variantId = selectedVariant?.id || getRequestedVariantId(item);

      if (variants.length > 0 && !selectedVariant) {
        return NextResponse.json(
          { error: 'Variant selection required' },
          { status: 400 }
        );
      }

      const availableStock = variants.length > 0
        ? Number(selectedVariant?.stock || 0)
        : typeof product.stock === 'number'
          ? product.stock
          : null;

      if (item.quantity > 0 && availableStock !== null && item.quantity > availableStock) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
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

      if (item.quantity <= 0) {
        // Si quantité = 0, supprimer l'item
        let deleteQuery = supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id)
          .eq('product_id', item.id);
        deleteQuery = withVariantFilter(deleteQuery, variantId);
        const { error: deleteError } = await deleteQuery;

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
      } else {
        // Mettre à jour la quantité
        let updateQuery = supabase
          .from('cart_items')
          .update({
            quantity: item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('cart_id', cart.id)
          .eq('product_id', item.id);
        updateQuery = withVariantFilter(updateQuery, variantId);
        const { error: updateError } = await updateQuery;

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      }

      // Retourner l'item mis à jour
      const transformedItem = {
        id: item.id,
        variantId: variantId || null,
        name: item.name || "",
        price: Number(selectedVariant?.price ?? item.price ?? 0),
        quantity: item.quantity,
        image: selectedVariant?.image || item.image || "",
        size: selectedVariant?.size || null,
        color: selectedVariant?.color || null,
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

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
