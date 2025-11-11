#!/usr/bin/env node

/**
 * Script de correction des API routes pour le checkout
 * Ce script corrige les problèmes 500 et rend les API compatibles avec Supabase
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  {
    path: 'app/api/checkout/quote/route.ts',
    content: `import { NextRequest, NextResponse } from 'next/server';
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
  try {
    // Résoudre la locale
    const referer = request.headers.get('referer') || '';
    const path = (() => { try { return new URL(referer).pathname; } catch { return referer; } })();
    const locale: 'fr' | 'en' = getLocaleFromPath(path);
    const checkoutNs = await getTranslations(locale, 'checkout');
    const commonNs = await getTranslations(locale, 'common');

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
      .select(\`
        id, 
        name, 
        name_fr, 
        name_en, 
        price, 
        "inStock", 
        product_variants(id, stock, size, color, price)
      \`)
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
    const msg = getTranslationKey(commonNs, 'common.error') || 'Server error';
    return NextResponse.json({ error: msg, details: err.message }, { status: 500 });
  }
}`
  },
  {
    path: 'app/api/products/route.ts',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('products')
      .select(\`
        *,
        product_variants(*),
        product_images(*),
        product_categories!inner(category_id)
      \`);

    if (id) {
      query = query.eq('id', id);
    }

    if (category) {
      query = query.eq('product_categories.category_id', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Products API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });

  } catch (error) {
    console.error('[Products API] Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}`
  },
  {
    path: 'app/api/cart/route.ts',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const CartSchema = z.object({
  action: z.enum(['add', 'remove', 'update', 'get']),
  user_id: z.string().uuid().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CartSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (parsed.action === 'get') {
      if (!parsed.user_id) {
        return NextResponse.json({ items: [] });
      }

      // Récupérer ou créer le panier
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', parsed.user_id)
        .single();

      if (cartError && cartError.code !== 'PGRST116') {
        console.error('[Cart API] Cart error:', cartError);
        return NextResponse.json({ error: cartError.message }, { status: 500 });
      }

      let cartId = cart?.id;
      if (!cart) {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ user_id: parsed.user_id })
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
        .select(\`
          *,
          products(id, name, name_fr, name_en, price, image, inStock)
        \`)
        .eq('cart_id', cartId);

      if (itemsError) {
        console.error('[Cart API] Items error:', itemsError);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }

      return NextResponse.json({ items: items || [] });
    }

    // Pour add/remove/update - implémentation future
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Cart API] Validation error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}`
  }
];

function backupFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const backupPath = `${fullPath}.backup.${Date.now()}`;
    fs.copyFileSync(fullPath, backupPath);
    console.log(`📁 Backup créé: ${backupPath}`);
    return backupPath;
  }
  return null;
}

function writeFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fichier créé: ${filePath}`);
}

async function main() {
  console.log('🔧 Correction des API routes pour Supabase');
  console.log('='.repeat(50));
  
  // Créer les backups
  const backups = [];
  for (const file of filesToFix) {
    const backup = backupFile(file.path);
    if (backup) backups.push(backup);
  }
  
  console.log(`📁 ${backups.length} backups créés`);
  
  // Écrire les nouveaux fichiers
  for (const file of filesToFix) {
    writeFile(file.path, file.content);
  }
  
  console.log('✅ Tous les fichiers ont été corrigés');
  console.log('🔍 Prochaines étapes:');
  console.log('   1. npm install @supabase/supabase-js');
  console.log('   2. Configurez vos variables d\'environnement');
  console.log('   3. Lancez npm run dev');
  console.log('   4. Testez /api/checkout/quote');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { filesToFix };
