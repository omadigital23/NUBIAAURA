import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const slug = process.argv[2] || 'chemise-wax-grande';

console.log(`🔍 Debugging product: ${slug}\n`);

const { data: product, error } = await supabase
  .from('products')
  .select(`
    id, slug, name, name_fr, name_en, image, image_url, price, rating, reviews, inStock, 
    description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en, sizes, colors, category,
    product_images(url, alt, position)
  `)
  .eq('slug', slug)
  .single();

if (error) {
  console.error('❌ Error fetching product:', error);
  process.exit(1);
}

if (!product) {
  console.error('❌ Product not found');
  process.exit(1);
}

console.log('📦 Product Data Retrieved:\n');
console.log('='.repeat(80));

console.log('\n📝 NAMES:');
console.log(`  name:    "${product.name}"`);
console.log(`  name_fr: ${product.name_fr === null ? 'NULL' : `"${product.name_fr}"`}`);
console.log(`  name_en: ${product.name_en === null ? 'NULL' : `"${product.name_en}"`}`);

console.log('\n📄 DESCRIPTIONS:');
console.log(`  description:    ${product.description === null ? 'NULL' : `"${product.description}"`}`);
console.log(`  description_fr: ${product.description_fr === null ? 'NULL' : `"${product.description_fr}"`}`);
console.log(`  description_en: ${product.description_en === null ? 'NULL' : `"${product.description_en}"`}`);

console.log('\n🧵 MATERIAL:');
console.log(`  material:    ${product.material === null ? 'NULL' : `"${product.material}"`}`);
console.log(`  material_fr: ${product.material_fr === null ? 'NULL' : `"${product.material_fr}"`}`);
console.log(`  material_en: ${product.material_en === null ? 'NULL' : `"${product.material_en}"`}`);

console.log('\n🧼 CARE:');
console.log(`  care:    ${product.care === null ? 'NULL' : `"${product.care}"`}`);
console.log(`  care_fr: ${product.care_fr === null ? 'NULL' : `"${product.care_fr}"`}`);
console.log(`  care_en: ${product.care_en === null ? 'NULL' : `"${product.care_en}"`}`);

console.log('\n' + '='.repeat(80));

console.log('\n🧪 TESTING LOCALE LOGIC:\n');

// Test French locale
const localeFr = 'fr';
const descriptionFr = (localeFr === "fr" ? product.description_fr : product.description_en) || product.description || '';
console.log(`When locale = "${localeFr}":`);
console.log(`  → Selected description: "${descriptionFr}"`);
console.log(`  → Expected: French text`);
console.log(`  ✓ ${descriptionFr === product.description_fr || descriptionFr === product.description ? 'PASS' : 'FAIL'}`);

// Test English locale
const localeEn = 'en';
const descriptionEn = (localeEn === "fr" ? product.description_fr : product.description_en) || product.description || '';
console.log(`\nWhen locale = "${localeEn}":`);
console.log(`  → Selected description: "${descriptionEn}"`);
console.log(`  → Expected: English text (description_en)`);
console.log(`  ✓ ${descriptionEn === product.description_en ? 'PASS' : 'FAIL'}`);

if (descriptionEn !== product.description_en) {
  console.log(`  ⚠️  WARNING: Logic returned "${descriptionEn}" instead of description_en`);
}

console.log('\n' + '='.repeat(80));

console.log('\n💡 DIAGNOSIS:\n');

if (!product.description_en) {
  console.log('❌ PROBLEM: description_en is NULL in database');
  console.log('   Solution: Run node scripts/fix-product-descriptions.mjs placeholder');
} else if (product.description_fr === product.description_en) {
  console.log('⚠️  ISSUE: description_fr and description_en are identical');
  console.log('   This means the English translation is missing or was copied from French');
  console.log('   Solution: Manually translate the English descriptions');
} else if (descriptionEn === product.description_fr) {
  console.log('❌ PROBLEM: The locale logic is selecting description_fr instead of description_en');
  console.log('   This is a code bug in the component');
} else {
  console.log('✅ Data and logic appear correct!');
  console.log('   If you still see French on English pages, check:');
  console.log('   1. Browser cache: Hard refresh (Ctrl+Shift+R)');
  console.log('   2. Next.js cache: Run npm run dev or restart server');
  console.log('   3. Check browser console logs for the actual locale value');
}

console.log('\n✨ Debug complete!\n');