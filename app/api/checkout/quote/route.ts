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
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

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
      let totalStock = 0;
      if (product.product_variants && product.product_variants.length > 0) {
        totalStock = product.product_variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      } else {
        totalStock = 999; // Stock par défaut si pas de variants
      }

      if (totalStock < reqItem.quantity) {
        const msg = getTranslationKey(commonNs, 'product.out_of_stock') || 'Out of stock';
        return NextResponse.json({ 
          error: msg, 
          product_id: reqItem.product_id 
        }, { status: 400 });
      }

      normalized.push({
        product_id: reqItem.product_id,
        price: Number(product.price),
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