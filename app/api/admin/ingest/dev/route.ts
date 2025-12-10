import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  // Dev-only safety
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  const bucket = 'products';
  const basePath = 'images';
  const defaultPrice = 75000;

  async function listRecursive(path: string, depth = 0): Promise<{ path: string; files: string[] }[]> {
    if (depth > 10) return []; // Prevent infinite recursion
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
    if (error) return [];
    
    const results: { path: string; files: string[] }[] = [];
    const items = data || [];

    // Skip parasitic folders/files
    const skipPatterns = ['banners', 'logo', 'visa', 'mastercard', 'paypal', 'wave', 'orange-money'];
    const filteredItems = items.filter((item: any) => {
      if (!item.name) return false;
      return !skipPatterns.some(p => item.name.toLowerCase().includes(p));
    });

    for (const item of filteredItems) {
      if (!item.name) continue;
      const itemPath = `${path}/${item.name}`.replace(/^\/+/, '');
      
      // If it's a file, check if it's 01-main
      if ((item.metadata?.size || 0) > 0) {
        if (/^01-main\.(jpg|jpeg|png|webp|gif|avif)$/i.test(item.name)) {
          // Found a product folder with 01-main
          const files = data.map((f: any) => f.name as string).filter((n: string) => (n.match(/^\d{2}-/) ? true : false));
          results.push({ path: itemPath.replace(/\/01-main\..+$/, ''), files });
        }
      } else {
        // It's a folder, recurse
        const subResults = await listRecursive(itemPath, depth + 1);
        results.push(...subResults);
      }
    }
    return results;
  }

  function toPublicUrl(path: string) {
    const clean = path.replace(/^\/+/, '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(clean);
    return data?.publicUrl || '';
  }

  const summary = { categories: 0, products: 0, updated: 0, imagesInserted: 0, errors: [] as { context: string; message: string }[] };

  try {
    // Find all product folders (those containing 01-main.*)
    const productFolders = await listRecursive(basePath);

    const processedSlugs = new Set<string>();

    for (const { path: prodPath } of productFolders) {
      try {
        // Get all files in this folder
        const { data: files, error: filesErr } = await supabase.storage.from(bucket).list(prodPath, { limit: 100 });
        if (filesErr || !files) continue;

        const fileNames = files.filter((f: any) => (f?.metadata?.size || 0) > 0).map((f: any) => f.name as string);
        const coverFile = fileNames.find((n: string) => /^01-main\.(jpg|jpeg|png|webp|gif|avif)$/i.test(n));
        const backFile = fileNames.find((n: string) => /^02-back\.(jpg|jpeg|png|webp|gif|avif)$/i.test(n));
        const detailFile = fileNames.find((n: string) => /^03-detail\.(jpg|jpeg|png|webp|gif|avif)$/i.test(n));

        if (!coverFile) continue;

        // Deduce slug and category from path
        // Path like: images/robes/soiree/longues/robe-soiree-longue-rouge-classique/petite
        const parts = prodPath.split('/').filter(Boolean);
        
        // Find the product folder (before variant folders like petite/moyenne/grande)
        let productFolderIdx = parts.length - 1;
        const variantNames = ['petite', 'moyenne', 'grande', 'small', 'medium', 'large'];
        if (variantNames.includes(parts[parts.length - 1])) {
          productFolderIdx = parts.length - 2;
        }
        
        const slug = parts[productFolderIdx];
        const category = parts[1] || 'uncategorized'; // robes, costumes, chemises

        // Skip duplicates (same slug) - only process first variant found
        if (processedSlugs.has(slug)) continue;
        processedSlugs.add(slug);

        const coverUrl = toPublicUrl(`${prodPath}/${coverFile}`);

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
          rating: 5,
          reviews: 0,
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

        const productId = (up as any).id as string;
        const inserts: { product_id: string; url: string; position: number }[] = [];
        if (backFile) inserts.push({ product_id: productId, url: toPublicUrl(`${prodPath}/${backFile}`), position: 1 });
        if (detailFile) inserts.push({ product_id: productId, url: toPublicUrl(`${prodPath}/${detailFile}`), position: inserts.length + 1 });
        if (inserts.length) {
          const { error: imgErr } = await supabase.from('product_images').insert(inserts);
          if (imgErr) throw new Error(imgErr.message);
          summary.imagesInserted += inserts.length;
        }
      } catch (e: any) {
        summary.errors.push({ context: 'product', message: e?.message || String(e) });
      }
    }

    // Count only main categories (images/<category>)
    summary.categories = new Set(productFolders.map((p) => {
      const parts = p.path.split('/').filter(Boolean);
      return parts[1]; // robes, costumes, chemises
    })).size;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e), summary }, { status: 500 });
  }

  return NextResponse.json({ ok: true, summary });
}
