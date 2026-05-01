import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CUSTOM_ONLY_CATEGORIES } from '@/lib/custom-categories';

export const dynamic = 'force-dynamic';

type ProductImage = {
  url: string | null;
  alt: string | null;
  position: number | null;
};

type HomeProduct = {
  id: string;
  slug: string;
  name: string | null;
  name_fr: string | null;
  name_en: string | null;
  image: string | null;
  image_url: string | null;
  price: number;
  rating: number | null;
  reviews: number | null;
  category: string | null;
  product_images: ProductImage[] | null;
};

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 8;
  return Math.max(1, Math.min(20, Math.floor(parsed)));
}

function parseSlugs(value: string | null) {
  if (!value) return [];
  return value
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function sortImages(images: ProductImage[] | null) {
  return [...(images || [])].sort((a, b) => {
    const aPosition = a.position ?? Number.MAX_SAFE_INTEGER;
    const bPosition = b.position ?? Number.MAX_SAFE_INTEGER;
    return aPosition - bPosition;
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ products: [] }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get('limit'));
    const slugs = parseSlugs(searchParams.get('slugs'));
    const excludeCustomOnly = searchParams.get('excludeCustomOnly') === '1';

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let query = supabase
      .from('products')
      .select('id, slug, name, name_fr, name_en, image, image_url, price, rating, reviews, category, product_images(url, alt, position)')
      .eq('inStock', true);

    if (slugs.length > 0) {
      query = query.in('slug', slugs);
    }

    if (excludeCustomOnly) {
      query = query.not('category', 'in', `(${CUSTOM_ONLY_CATEGORIES.map((category) => `"${category}"`).join(',')})`);
    }

    const { data, error } = await query
      .order('rating', { ascending: false, nullsFirst: false })
      .order('reviews', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.warn('[home-products] Failed to load products:', error.message);
      return NextResponse.json({ products: [] }, { status: 200 });
    }

    const products = ((data || []) as HomeProduct[]).map((product) => ({
      ...product,
      product_images: sortImages(product.product_images),
    }));

    if (slugs.length > 0) {
      const orderMap = new Map(slugs.map((slug, index) => [slug, index] as const));
      products.sort((a, b) => (orderMap.get(a.slug) ?? 999) - (orderMap.get(b.slug) ?? 999));
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.warn('[home-products] Server error:', error);
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
