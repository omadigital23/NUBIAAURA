import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  console.log('\n📊 ANALYZING PRODUCT DETAIL PAGE\n');
  
  // Get first product
  const { data: products, error: err1 } = await supabase
    .from('products')
    .select('id, slug, name, image_url, category')
    .limit(1);
  
  if (err1 || !products || products.length === 0) {
    console.error('❌ No products found');
    process.exit(1);
  }
  
  const product = products[0];
  console.log(`📦 Product: ${product.name} (${product.slug})`);
  console.log(`   Category: ${product.category}`);
  console.log(`   Image URL: ${product.image_url}\n`);
  
  // Get product with full details including images
  const { data: fullProduct, error: err2 } = await supabase
    .from('products')
    .select(`
      id, 
      slug, 
      name, 
      image_url, 
      image,
      category,
      product_images(id, url, alt, position),
      product_variants(id, size, color, price, stock)
    `)
    .eq('slug', product.slug)
    .single();
  
  if (err2) {
    console.error('❌ Error fetching product details:', err2.message);
    process.exit(1);
  }
  
  console.log('🔍 FULL PRODUCT DATA:\n');
  console.log(JSON.stringify(fullProduct, null, 2));
  
  console.log('\n📈 ANALYSIS:\n');
  console.log(`✓ Product ID: ${fullProduct.id}`);
  console.log(`✓ Product Slug: ${fullProduct.slug}`);
  console.log(`✓ Product Name: ${fullProduct.name}`);
  console.log(`✓ Image URL (cover): ${fullProduct.image_url}`);
  console.log(`✓ Image (fallback): ${fullProduct.image}`);
  
  const images = fullProduct.product_images || [];
  console.log(`\n📸 PRODUCT IMAGES: ${images.length} found`);
  
  if (images.length === 0) {
    console.log('   ❌ NO IMAGES IN product_images TABLE!');
  } else {
    images.forEach((img, idx) => {
      console.log(`   ${idx + 1}. Position ${img.position}: ${img.url}`);
    });
  }
  
  const variants = fullProduct.product_variants || [];
  console.log(`\n🎨 PRODUCT VARIANTS: ${variants.length} found`);
  if (variants.length > 0) {
    variants.slice(0, 3).forEach((v, idx) => {
      console.log(`   ${idx + 1}. Size: ${v.size}, Color: ${v.color}, Price: ${v.price}, Stock: ${v.stock}`);
    });
    if (variants.length > 3) {
      console.log(`   ... and ${variants.length - 3} more`);
    }
  }
  
  // Check what the page would render
  console.log('\n🖼️  WHAT THE PAGE SHOULD RENDER:\n');
  
  const cover = fullProduct.image_url || fullProduct.image;
  const gallery = (fullProduct.product_images || []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  
  const thumbs = [];
  if (cover) thumbs.push(cover);
  thumbs.push(...gallery.map(g => g.url));
  
  const displayed = thumbs.slice(0, 3);
  
  console.log(`Cover image: ${cover}`);
  console.log(`Gallery images: ${gallery.length}`);
  console.log(`Thumbnails to display: ${displayed.length}`);
  
  if (displayed.length === 0) {
    console.log('❌ NO THUMBNAILS - Page will show "Aucune image disponible"');
  } else {
    displayed.forEach((url, idx) => {
      console.log(`   ${idx + 1}. ${url}`);
    });
  }
  
  console.log('\n✅ Analysis complete!\n');
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
