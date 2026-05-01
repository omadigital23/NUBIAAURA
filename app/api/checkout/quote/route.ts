import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { computeQuote, QuoteItem, ShippingMethod } from '@/lib/pricing';
import { getLocaleFromPath, getTranslations, getTranslationKey } from '@/lib/i18n';

const QuoteSchema = z.object({
  locale: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express']),
  country: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.string().min(1),
      variant_id: z.string().uuid().nullable().optional(),
      size: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

type VariantInput = {
  variant_id?: string | null;
  size?: string | null;
  color?: string | null;
};

type ProductVariant = {
  id: string;
  stock?: number | null;
  size?: string | null;
  color?: string | null;
  price?: number | string | null;
};

function findRequestedVariant(variants: ProductVariant[], item: VariantInput) {
  if (!variants.length) return null;
  if (item.variant_id) {
    return variants.find((variant) => variant.id === item.variant_id) || null;
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

export async function POST(request: NextRequest) {
  // Résoudre la locale en dehors du try pour l'utiliser dans le catch
  const referer = request.headers.get('referer') || '';
  const path = (() => { try { return new URL(referer).pathname; } catch { return referer; } })();
  const locale: 'fr' | 'en' = getLocaleFromPath(path);
  const commonNs = await getTranslations(locale, 'common');

  try {

    // Valider l'entrée
    const body = await request.json();
    const parsed = QuoteSchema.parse(body);

    if (process.env.PLAYWRIGHT === '1') {
      const quote = computeQuote({
        items: parsed.items.map((item) => ({
          product_id: item.product_id,
          price: 25000,
          quantity: item.quantity,
        })),
        shippingMethod: parsed.shippingMethod as ShippingMethod,
        country: parsed.country,
      });

      return NextResponse.json({
        success: true,
        quote,
      });
    }

    // Connexion Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer les produits avec leurs variants
    const productIds = parsed.items.map(i => i.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        name_fr, 
        name_en, 
        price, 
        stock,
        "inStock", 
        product_variants(id, stock, size, color, price)
      `)
      .in('id', productIds);

    if (error) {
      console.error('[Quote API] Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        error: 'Products not found' 
      }, { status: 404 });
    }

    // Construire les items normalisés
    const { data: reservations } = await supabase
      .from('stock_reservations')
      .select('product_id, variant_id, qty, expires_at, finalized_at, released_at')
      .in('product_id', productIds);

    const now = Date.now();
    const reservedByProduct = new Map<string, number>();
    const reservedByVariant = new Map<string, number>();
    if (Array.isArray(reservations)) {
      for (const reservation of reservations as any[]) {
        const isFinalized = !!reservation.finalized_at;
        const isActive = !reservation.released_at && new Date(reservation.expires_at).getTime() > now;
        if (!isFinalized && !isActive) continue;

        const qty = Number(reservation.qty || 0);
        if (reservation.variant_id) {
          reservedByVariant.set(reservation.variant_id, (reservedByVariant.get(reservation.variant_id) || 0) + qty);
        } else {
          reservedByProduct.set(reservation.product_id, (reservedByProduct.get(reservation.product_id) || 0) + qty);
        }
      }
    }

    const normalized: QuoteItem[] = [];
    for (const reqItem of parsed.items) {
      const product = products.find(p => p.id === reqItem.product_id);
      if (!product || !product.inStock) {
        const msg = getTranslationKey(commonNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({ 
          error: msg, 
          product_id: reqItem.product_id 
        }, { status: 400 });
      }

      // Calculer le stock total
      const variants = Array.isArray(product.product_variants)
        ? product.product_variants as ProductVariant[]
        : [];
      const selectedVariant = findRequestedVariant(variants, reqItem);

      if (variants.length > 0 && !selectedVariant) {
        const msg = getTranslationKey(commonNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({
          error: msg,
          product_id: reqItem.product_id
        }, { status: 400 });
      }

      let totalStock = 0;
      if (variants.length > 0) {
        totalStock = Number(selectedVariant?.stock || 0);
      } else {
        totalStock = 999; // Stock par défaut si pas de variants
      }

      if (variants.length === 0 && typeof product.stock === 'number') {
        totalStock = product.stock;
      }

      const reserved = selectedVariant
        ? (reservedByVariant.get(selectedVariant.id) || 0) + (reservedByProduct.get(reqItem.product_id) || 0)
        : reservedByProduct.get(reqItem.product_id) || 0;

      if ((totalStock - reserved) < reqItem.quantity) {
        const msg = getTranslationKey(commonNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({ 
          error: msg, 
          product_id: reqItem.product_id 
        }, { status: 400 });
      }

      normalized.push({
        product_id: reqItem.product_id,
        price: Number(selectedVariant?.price ?? product.price),
        quantity: reqItem.quantity
      });
    }

    // Calculer le devis
    const quote = computeQuote({
      items: normalized,
      shippingMethod: parsed.shippingMethod as ShippingMethod,
      country: parsed.country,
    });

    console.log('[Quote API] Computed quote:', JSON.stringify(quote, null, 2));

    return NextResponse.json({ 
      success: true, 
      quote 
    });

  } catch (err: any) {
    console.error('[Quote API] Unexpected error:', err);
    
    // Gérer les erreurs de validation Zod
    if (err.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: err.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Server error', 
      details: err.message 
    }, { status: 500 });
  }
}
