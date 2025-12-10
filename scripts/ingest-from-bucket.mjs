import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

const BUCKET = 'products';
const BASE_PATH = process.env.INGEST_BASE_PATH || 'products/images';
const DEFAULT_PRICE = Number(process.env.INGEST_DEFAULT_PRICE || 75000);
const DRY_RUN = String(process.env.INGEST_DRY_RUN || 'true').toLowerCase() === 'true';

async function list(path) {
  const { data, error } = await supabase.storage.from(BUCKET).list(path, { limit: 1000 });
  if (error) throw new Error(error.message);
  return data || [];
}

function pubUrl(path) {
  const clean = path.replace(/^\/+/, '');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(clean);
  return data?.publicUrl || '';
}

async function run() {
  const summary = { categories: 0, products: 0, updated: 0, imagesInserted: 0, errors: [] };

  const root = BASE_PATH.replace(/^\/+|\/+$/g, '');
  const cats = await list(root);
  const categoryDirs = cats.filter((e) => e.name && e.id && e.metadata && e.metadata.size === 0);

  for (const cat of categoryDirs) {
    const category = cat.name;
    summary.categories += 1;
    const catPath = root ? `${root}/${category}` : `${category}`;

    const prods = await list(catPath);
    const prodDirs = prods.filter((e) => e.name && e.id && e.metadata && e.metadata.size === 0);

    for (const pdir of prodDirs) {
      try {
        const slug = pdir.name;
        const prodPath = `${catPath}/${slug}`;
        const files = await list(prodPath);
        const fileNames = files.filter((f) => (f?.metadata?.size || 0) > 0).map((f) => f.name);

        const coverFile = fileNames.find((n) => /^01-main\.(png|jpg|jpeg|webp|gif|avif)$/i.test(n)) || fileNames[0];
        const backFile = fileNames.find((n) => /^02-back\.(png|jpg|jpeg|webp|gif|avif)$/i.test(n));
        const detailFile = fileNames.find((n) => /^03-detail\.(png|jpg|jpeg|webp|gif|avif)$/i.test(n));

        if (!coverFile) {
          summary.errors.push({ context: `${category}/${slug}`, message: 'No image found' });
          continue;
        }

        const coverPath = `${prodPath}/${coverFile}`;
        const coverUrl = pubUrl(coverPath);

        if (!DRY_RUN) {
          const payload = {
            slug,
            name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            name_fr: null,
            name_en: null,
            description: null,
            description_fr: null,
            description_en: null,
            price: DEFAULT_PRICE,
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

          const pid = up.id;
          const inserts = [];
          if (backFile) inserts.push({ product_id: pid, url: pubUrl(`${prodPath}/${backFile}`), position: 1 });
          if (detailFile) inserts.push({ product_id: pid, url: pubUrl(`${prodPath}/${detailFile}`), position: inserts.length + 1 });

          if (inserts.length) {
            const { error: imgErr } = await supabase.from('product_images').insert(inserts);
            if (imgErr) throw new Error(imgErr.message);
            summary.imagesInserted += inserts.length;
          }
        } else {
          summary.products += 1;
        }
      } catch (e) {
        summary.errors.push({ context: 'product', message: String(e?.message || e) });
      }
    }
  }

  console.log(JSON.stringify({ ok: true, dryRun: DRY_RUN, summary }, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
