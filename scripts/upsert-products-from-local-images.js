/*
  Generate products from local public/images structure and upsert into Supabase `products` table.
  Assumes your Supabase bucket mirrors `public/images` paths.

  Env required:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET (defaults: products)
    DEFAULT_PRODUCT_PRICE (optional, default: 50000)

  Run:
    npm run upsert:products:from-images
*/

// Load env from .env.local first, then fallback to .env
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local', override: true });
dotenv.config();

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET || 'products';
const DEFAULT_PRICE = Number(process.env.DEFAULT_PRODUCT_PRICE || 50000);
const MIN_PRICE = 25000;
const CATEGORY_DEFAULTS = {
  chemises: 35000,
  robes: 65000,
  costumes: 120000,
};

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const PROJECT_ROOT = process.cwd();
const IMAGES_ROOT = path.join(PROJECT_ROOT, 'public', 'images');

const INCLUDE_ROOT_CATEGORIES = new Set(['chemises', 'robes', 'costumes']);
const EXCLUDE_FILES = new Set(['visa.png', 'mastercard.png', 'orange-money.png', 'wave.png', 'paypal.png']);
const EXCLUDE_FOLDERS = new Set(['banners']);

function toSlug(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function titleCaseFromSlug(slug) {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

async function* walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const d of entries) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (!EXCLUDE_FOLDERS.has(d.name)) {
        yield* walk(full);
      }
    } else if (d.isFile()) {
      const ext = path.extname(d.name).toLowerCase();
      if (ext === '.png' && !EXCLUDE_FILES.has(d.name)) {
        yield full;
      }
    }
  }
}

function deriveProductFromPath(absFile) {
  // absFile like: <root>/public/images/chemises/wax/chemise-wax-grande/01-main.png
  const relFromImages = path.relative(IMAGES_ROOT, absFile).replace(/\\/g, '/');
  const segments = relFromImages.split('/');
  const rootCat = segments[0];
  if (!INCLUDE_ROOT_CATEGORIES.has(rootCat)) return null; // skip banners, logos, etc.

  const fileBase = path.basename(relFromImages, path.extname(relFromImages));
  const parent = segments.length > 1 ? segments[segments.length - 2] : '';

  // Slug from parent + filename when available, else from filename only
  const rawSlug = parent && parent !== rootCat ? `${parent}-${fileBase}` : fileBase;
  const slug = toSlug(rawSlug);

  const name = titleCaseFromSlug(slug);
  const imageKey = `images/${relFromImages}`; // relative key in bucket
  const basePrice = CATEGORY_DEFAULTS[rootCat] ?? DEFAULT_PRICE;
  const price = Math.max(MIN_PRICE, Number(basePrice) || DEFAULT_PRICE);

  return {
    slug,
    name,
    name_fr: name,
    name_en: name,
    category: rootCat,
    price,
    inStock: true,
    image: imageKey,
  };
}

async function upsertProducts(products) {
  let done = 0;
  const chunk = 100;
  for (let i = 0; i < products.length; i += chunk) {
    const batch = products.slice(i, i + chunk);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'slug' })
      .select('id');
    if (error) {
      console.error('Upsert error:', error.message);
      process.exit(1);
    }
    done += batch.length;
    console.log(`Upserted ${done}/${products.length}`);
  }
}

(async () => {
  if (!fs.existsSync(IMAGES_ROOT)) {
    console.error(`Not found: ${IMAGES_ROOT}`);
    process.exit(1);
  }

  const candidates = [];
  for await (const file of walk(IMAGES_ROOT)) {
    const p = deriveProductFromPath(file);
    if (p) candidates.push(p);
  }

  if (candidates.length === 0) {
    console.log('No PNG product images found under public/images for categories:', [...INCLUDE_ROOT_CATEGORIES].join(', '));
    process.exit(0);
  }

  // Deduplicate by slug (keep first occurrence)
  const map = new Map();
  for (const p of candidates) {
    if (!map.has(p.slug)) map.set(p.slug, p);
  }
  const products = Array.from(map.values());

  console.log(`Prepared ${products.length} products to upsert`);
  await upsertProducts(products);
  console.log('Done.');
})();
