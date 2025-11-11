// scripts/seed_products.mjs
// Inserts sample products with FR/EN fields, prices in CFA, and product_variants stock=10

import dotenv from 'dotenv';
import { existsSync } from 'fs';
const envPath = existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function slugify(s) {
  return s
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categories = [
  { slug: 'costumes-africains', name: 'Costumes africains', name_fr: 'Costumes africains', name_en: 'African suits' },
  { slug: 'robe-de-mariage', name: 'Robe de mariage', name_fr: 'Robe de mariage', name_en: 'Wedding dress' },
  { slug: 'robe-de-soiree', name: 'Robe de soirée', name_fr: 'Robe de soirée', name_en: 'Evening dress' },
  { slug: 'costumes-classiques', name: 'Costumes', name_fr: 'Costumes', name_en: 'Suits' },
  { slug: 'chemises', name: 'Chemises', name_fr: 'Chemises', name_en: 'Shirts' },
];

const products = [
  // Costumes africains
  {
    name: 'Costume africain brodé doré',
    name_en: 'African suit with gold embroidery',
    description: 'Costume traditionnel élégant brodé à la main.',
    description_en: 'Elegant traditional suit with hand embroidery.',
    category: 'costumes-africains',
    price: 180000,
    originalPrice: 220000,
    sizes: ['S','M','L','XL'],
    colors: ['Noir','Or'],
    image_url: 'https://images.unsplash.com/photo-1520975922203-b3f29cd3d0f5',
  },
  {
    name: 'Costume africain motif wax',
    name_en: 'African suit wax pattern',
    description: 'Costume moderne en tissu wax premium.',
    description_en: 'Modern suit made with premium wax fabric.',
    category: 'costumes-africains',
    price: 150000,
    originalPrice: 180000,
    sizes: ['S','M','L','XL'],
    colors: ['Bleu','Multicolore'],
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
  },
  // Robe de mariage
  {
    name: 'Robe de mariage princesse',
    name_en: 'Princess wedding dress',
    description: 'Robe ample en tulle avec détails dentelle.',
    description_en: 'Voluminous tulle dress with lace details.',
    category: 'robe-de-mariage',
    price: 350000,
    originalPrice: 420000,
    sizes: ['S','M','L'],
    colors: ['Blanc','Ivoire'],
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
  },
  {
    name: 'Robe de mariage sirène',
    name_en: 'Mermaid wedding dress',
    description: 'Coupe sirène élégante, bustier brodé.',
    description_en: 'Elegant mermaid cut with embroidered bodice.',
    category: 'robe-de-mariage',
    price: 400000,
    originalPrice: 480000,
    sizes: ['S','M','L'],
    colors: ['Blanc','Ivoire'],
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552',
  },
  // Robe de soirée
  {
    name: 'Robe de soirée satin',
    name_en: 'Satin evening dress',
    description: 'Robe fluide en satin, dos nu.',
    description_en: 'Flowing satin dress with open back.',
    category: 'robe-de-soiree',
    price: 120000,
    originalPrice: 150000,
    sizes: ['S','M','L'],
    colors: ['Rouge','Noir'],
    image_url: 'https://images.unsplash.com/photo-1514986888952-8cd320577b68',
  },
  {
    name: 'Robe de soirée paillettes',
    name_en: 'Sequin evening dress',
    description: 'Robe longue ornée de paillettes.',
    description_en: 'Long dress adorned with sequins.',
    category: 'robe-de-soiree',
    price: 140000,
    originalPrice: 170000,
    sizes: ['S','M','L'],
    colors: ['Argent','Noir'],
    image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
  },
  // Costumes classiques
  {
    name: 'Costume classique bleu marine',
    name_en: 'Classic navy suit',
    description: 'Costume deux pièces coupe slim.',
    description_en: 'Two-piece slim-fit suit.',
    category: 'costumes-classiques',
    price: 200000,
    originalPrice: 250000,
    sizes: ['S','M','L','XL'],
    colors: ['Bleu marine'],
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
  },
  {
    name: 'Costume gris anthracite',
    name_en: 'Charcoal grey suit',
    description: 'Costume polyvalent pour affaires et événements.',
    description_en: 'Versatile suit for business and events.',
    category: 'costumes-classiques',
    price: 210000,
    originalPrice: 260000,
    sizes: ['S','M','L','XL'],
    colors: ['Gris'],
    image_url: 'https://images.unsplash.com/photo-1520975374161-04f2a1d8b6f8',
  },
  // Chemises
  {
    name: 'Chemise blanche premium',
    name_en: 'Premium white shirt',
    description: 'Chemise en coton égyptien.',
    description_en: 'Shirt made of Egyptian cotton.',
    category: 'chemises',
    price: 35000,
    originalPrice: 45000,
    sizes: ['S','M','L','XL'],
    colors: ['Blanc'],
    image_url: 'https://images.unsplash.com/photo-1593032457860-ef9f6e00d0be',
  },
  {
    name: 'Chemise bleu ciel',
    name_en: 'Sky blue shirt',
    description: 'Chemise classique coupe ajustée.',
    description_en: 'Classic shirt with tailored fit.',
    category: 'chemises',
    price: 30000,
    originalPrice: 40000,
    sizes: ['S','M','L','XL'],
    colors: ['Bleu ciel'],
    image_url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
  },
];

async function upsertCategories() {
  const { data: existing, error } = await supabase
    .from('categories')
    .upsert(
      categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        name_fr: c.name_fr,
        name_en: c.name_en,
      })),
      { onConflict: 'slug' }
    )
    .select();
  if (error) throw error;
  const map = new Map();
  for (const c of existing) map.set(c.slug, c.id);
  return map;
}

async function seed() {
  console.log('Seeding categories...');
  let categoryMap = new Map();
  try {
    categoryMap = await upsertCategories();
  } catch (e) {
    console.warn('Categories upsert failed or table missing, continuing with product.category only:', e.message || e);
  }

  console.log('Seeding products...');
  for (const p of products) {
    const slug = slugify(p.name);
    const productPayload = {
      slug,
      name: p.name,
      name_fr: p.name,
      name_en: p.name_en,
      description: p.description,
      description_fr: p.description,
      description_en: p.description_en,
      material_fr: null,
      material_en: null,
      care_fr: null,
      care_en: null,
      price: p.price,
      image_url: p.image_url,
      image: p.image_url,
      rating: 5,
      reviews: 0,
      category: p.category,
      originalPrice: p.originalPrice,
      inStock: true,
      sizes: p.sizes,
      colors: p.colors,
    };

    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .insert(productPayload)
      .select('*')
      .single();
    if (prodErr) {
      console.error('Product insert failed:', slug, prodErr.message || prodErr);
      continue;
    }
    console.log('Inserted product', prod.slug);

    // Link category if category table exists
    const catId = categoryMap.get(p.category);
    if (catId) {
      await supabase
        .from('product_categories')
        .insert({ product_id: prod.id, category_id: catId })
        .select();
    }

    // Create one variant with stock 10
    const variant = {
      product_id: prod.id,
      sku: `${prod.slug}-STD`,
      size: p.sizes?.[0] || 'M',
      color: p.colors?.[0] || 'Noir',
      price: p.price,
      stock: 10,
      image: p.image_url,
    };

    const { error: varErr } = await supabase.from('product_variants').insert(variant);
    if (varErr) {
      console.error('Variant insert failed for', prod.slug, varErr.message || varErr);
    }
  }

  console.log('Seeding complete.');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
