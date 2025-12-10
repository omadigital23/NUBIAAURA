import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

function verify(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected || token !== expected) return false;
  return true;
}

interface ManifestProduct {
  slug: string;
  name_fr?: string;
  name_en?: string;
  price: number;
  category: string;
  description_fr?: string | null;
  description_en?: string | null;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  cover: string; // path inside bucket, e.g. "products/robe-elite/cover.jpg" or "robe-elite/cover.jpg"
  gallery?: string[]; // paths inside bucket
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseServerClient();

  // Request options
  const { manifestPath, dryRun, defaultCategory } = await req.json().catch(() => ({ manifestPath: undefined, dryRun: false, defaultCategory: undefined })) as {
    manifestPath?: string;
    dryRun?: boolean;
    defaultCategory?: string;
  };

  const bucket = 'products';
  const path = (manifestPath && typeof manifestPath === 'string' && manifestPath.trim()) || 'manifest.json';

  // Download manifest.json from the bucket
  const { data: file, error: dlErr } = await supabase.storage.from(bucket).download(path);
  if (dlErr || !file) {
    return NextResponse.json({
      error: dlErr?.message || 'Manifest not found',
      hint: 'Upload a JSON manifest to the products bucket. Example shape: [{ slug, name_fr, name_en, price, category, cover, gallery[] }]'
    }, { status: 400 });
  }

  let text = '';
  try {
    const buf = await file.arrayBuffer();
    text = Buffer.from(buf).toString('utf-8');
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to read manifest file', details: e?.message || String(e) }, { status: 500 });
  }

  let items: ManifestProduct[] = [];
  try {
    const json = JSON.parse(text);
    if (!Array.isArray(json)) throw new Error('Manifest must be an array of products');
    items = json as ManifestProduct[];
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid JSON manifest', details: e?.message || String(e) }, { status: 400 });
  }

  // Helper to build public URL from a path (accepts paths with or without leading bucket folder)
  const toPublicUrl = (p: string) => {
    const clean = p.replace(/^\/+/, '').replace(/^products\//, '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(`products/${clean}`);
    return data?.publicUrl || '';
  };

  const summary = {
    total: items.length,
    created: 0,
    updated: 0,
    imagesInserted: 0,
    errors: [] as { slug?: string; message: string }[],
  };

  for (const item of items) {
    try {
      const slug = item.slug?.trim();
      if (!slug) throw new Error('Missing slug');
      const category = (item.category || defaultCategory || '').trim();
      if (!category) throw new Error('Missing category (provide in manifest or defaultCategory)');
      if (typeof item.price !== 'number') throw new Error('Missing price');
      if (!item.cover) throw new Error('Missing cover path');

      const coverUrl = toPublicUrl(item.cover);
      if (!coverUrl) throw new Error('Failed to resolve public URL for cover');

      const payload: any = {
        slug,
        name: item.name_fr || item.name_en || slug,
        name_fr: item.name_fr || item.name_en || slug,
        name_en: item.name_en || item.name_fr || slug,
        description: item.description_fr || item.description_en || null,
        description_fr: item.description_fr || null,
        description_en: item.description_en || null,
        price: item.price,
        image: coverUrl,
        image_url: coverUrl,
        rating: item.rating ?? 5,
        reviews: item.reviews ?? 0,
        category,
        originalPrice: null,
        inStock: item.inStock ?? true,
        sizes: item.sizes || null,
        colors: item.colors || null,
      };

      if (dryRun) {
        // Simulate
        summary.updated += 1; // count as checked
        continue;
      }

      // Upsert product by slug
      const { data: up, error: upErr } = await supabase
        .from('products')
        .upsert(payload, { onConflict: 'slug' })
        .select('id, slug')
        .single();

      if (upErr) throw new Error(upErr.message);
      const productId = up!.id as string;

      // Determine if it was created or updated: try to fetch by slug before upsert would be costly; we mark as updated by default
      summary.updated += 1;

      // Insert gallery images if provided
      if (Array.isArray(item.gallery) && item.gallery.length > 0) {
        const galleryUrls = item.gallery.map(toPublicUrl).filter(Boolean);
        if (galleryUrls.length) {
          const inserts = galleryUrls.map((url, i) => ({ product_id: productId, url, position: i + 1 }));
          const { error: imgErr } = await supabase.from('product_images').insert(inserts);
          if (imgErr) throw new Error(`Gallery insert failed: ${imgErr.message}`);
          summary.imagesInserted += inserts.length;
        }
      }
    } catch (e: any) {
      summary.errors.push({ slug: (e?.slug as string) || undefined, message: e?.message || String(e) });
    }
  }

  return NextResponse.json({ ok: true, summary });
}
