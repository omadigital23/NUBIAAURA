/*
  Backfill product.image to relative Supabase storage keys and clear product.image_url.
  - Reads all rows from `products`
  - Normalizes image/image_url to a relative key like: images/.../file.png
  - Updates rows where a change is needed

  Env required:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET (defaults to 'products')

  Run:
    npm run backfill:product-images
*/

// Load env from .env.local first, then fallback to .env
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local', override: true });
dotenv.config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET || 'products';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

function toRelativeKey(input) {
  if (!input) return '';
  let s = String(input).trim();
  if (!s) return '';
  // If it's a public supabase URL, strip to relative key after .../public/<bucket>/
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = s.indexOf(marker);
  if (i >= 0) {
    return s.substring(i + marker.length);
  }
  // If it starts with a slash, drop it
  if (s.startsWith('/')) return s.replace(/^\/+/, '');
  // If it's another absolute URL (cloudinary/unsplash), leave as-is (we won't backfill blindly)
  if (/^https?:\/\//i.test(s)) return s;
  // Otherwise assume it's already a relative key
  return s;
}

async function fetchAllProducts() {
  const rows = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, name, image, image_url')
      .range(from, from + step - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return rows;
}

async function run() {
  const rows = await fetchAllProducts();
  console.log(`Fetched ${rows.length} products`);

  let updates = 0;
  for (const p of rows) {
    const current = p.image || p.image_url || '';
    const rel = toRelativeKey(current);

    // If current is absolute external URL (non-Supabase), skip to avoid wrong mapping
    const isExternal = /^https?:\/\//i.test(current) && !current.includes('/storage/v1/object/public/');

    // Determine if we need to update
    const needUpdate = (!isExternal) && rel && rel !== p.image;

    if (needUpdate) {
      const { error } = await supabase
        .from('products')
        .update({ image: rel, image_url: null })
        .eq('id', p.id);
      if (error) {
        console.error(`Failed to update product ${p.id} (${p.slug || p.name}):`, error.message);
      } else {
        updates++;
        if (updates % 25 === 0) console.log(`Updated ${updates} products...`);
      }
    }
  }

  console.log(`Done. Updated ${updates} products.`);
}

run().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
