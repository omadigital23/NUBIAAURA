import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

function verify(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected || token !== expected) return false;
  return true;
}

interface IngestOptions {
  basePath?: string; // prefix inside bucket, e.g. '' or 'products'
  defaultPrice?: number; // FCFA price if not provided elsewhere
  defaultRating?: number;
  defaultReviews?: number;
  dryRun?: boolean;
}

const DEFAULTS = {
  price: 75000,
  rating: 5,
  reviews: 0,
};

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseServerClient();
  const bucket = 'products';
  const { basePath = '', defaultPrice = DEFAULTS.price, defaultRating = DEFAULTS.rating, defaultReviews = DEFAULTS.reviews, dryRun = false } = (await req.json().catch(() => ({}))) as IngestOptions;

  // Utility: list items in a folder
  async function list(path: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
    if (error) throw new Error(error.message);
    return data || [];
  }

  // Utility: public URL
  function toPublicUrl(path: string) {
    const clean = path.replace(/^\/+/, '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(clean);
    return data?.publicUrl || '';
  }

  const summary = {
    categories: 0,
    products: 0,
    created: 0,
    updated: 0,
    imagesInserted: 0,
    errors: [] as { context: string; message: string }[],
  };

  try {
    // 1) List categories (folders at basePath)
    const categoryPrefix = basePath.replace(/^\/+|\/+$/g, '');
    const rootPath = categoryPrefix ? `${categoryPrefix}` : '';
    const cats = await list(rootPath);
    const categoryDirs = cats.filter((e) => e.name && e.id && e.metadata && e.metadata.size === 0); // folders have size 0

    for (const cat of categoryDirs) {
      const category = cat.name;
      summary.categories += 1;
      const catPath = rootPath ? `${rootPath}/${category}` : `${category}`;

      // 2) List product folders in category
      const prods = await list(catPath);
      const prodDirs = prods.filter((e) => e.name && e.id && e.metadata && e.metadata.size === 0);

      for (const pdir of prodDirs) {
        try {
          const slug = pdir.name;
          const prodPath = `${catPath}/${slug}`;
          const files = await list(prodPath);
          const fileNames = files.filter((f) => (f?.metadata?.size || 0) > 0).map((f) => f.name);

          // Expect 01-main, 02-back, 03-detail (any extension)
          const coverFile = fileNames.find((n) => /^01-main\.(png|jpg|jpeg|webp|gif|avif)$/i.test(n)) || fileNames[0];
          const backFile = fileNames.find((n) => /^02-back\.(png|jpg|jpeg|webp|gif|avif)$/i.test(n));
          const detailFile = fileNames.find((n) => /^03-detail\.(png|jpg|jpeg|webp|gif|avif)$/i.test(n));

          if (!coverFile) {
            summary.errors.push({ context: `${category}/${slug}`, message: 'No image found (missing 01-main.* too)' });
            continue;
          }

          const coverPath = `${prodPath}/${coverFile}`;
          const coverUrl = toPublicUrl(coverPath.startsWith(bucket + '/') ? coverPath : `${coverPath}`);

          if (!dryRun) {
            // Upsert product by slug
            const payload: any = {
              slug,
              name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              name_fr: null,
              name_en: null,
              description: null,
              description_fr: null,
              description_en: null,
              price: defaultPrice,
              image: coverUrl,
              image_url: coverUrl,
              rating: defaultRating,
              reviews: defaultReviews,
              category,
              originalPrice: null,
              inStock: true,
              sizes: null,
              colors: null,
            };

            const { data: up, error: upErr } = await supabase
              .from('products')
              .upsert(payload, { onConflict: 'slug' })
              .select('id, slug')
              .single();
            if (upErr) throw new Error(upErr.message);
            summary.products += 1;
            summary.updated += 1;

            const productId = up!.id as string;

            // Insert gallery (02, 03) with positions 1,2 (or next positions)
            const galleryInserts: { product_id: string; url: string; position: number }[] = [];
            if (backFile) {
              const url = toPublicUrl(`${prodPath}/${backFile}`);
              if (url) galleryInserts.push({ product_id: productId, url, position: 1 });
            }
            if (detailFile) {
              const url = toPublicUrl(`${prodPath}/${detailFile}`);
              if (url) galleryInserts.push({ product_id: productId, url, position: galleryInserts.length + 1 });
            }

            if (galleryInserts.length) {
              const { error: imgErr } = await supabase.from('product_images').insert(galleryInserts);
              if (imgErr) throw new Error(`Gallery insert failed: ${imgErr.message}`);
              summary.imagesInserted += galleryInserts.length;
            }
          } else {
            summary.products += 1; // counted as processed
          }
        } catch (e: any) {
          summary.errors.push({ context: `product`, message: e?.message || String(e) });
        }
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e), summary }, { status: 500 });
  }

  return NextResponse.json({ ok: true, summary });
}
