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
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Fetching all products from Supabase...\n');

const { data: products, error } = await supabase
  .from('products')
  .select('id, slug, name, description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en')
  .order('created_at', { ascending: true });

if (error) {
  console.error('❌ Error fetching products:', error);
  process.exit(1);
}

console.log(`📦 Found ${products.length} products\n`);

// Analyze products with missing translations
const productsNeedingFix = products.filter(p => !p.description_en || !p.material_en || !p.care_en);

console.log('📊 Products Status:');
console.log(`  ✅ Complete: ${products.length - productsNeedingFix.length}`);
console.log(`  ⚠️  Missing English translations: ${productsNeedingFix.length}\n`);

if (productsNeedingFix.length === 0) {
  console.log('✅ All products have English translations!');
  console.log('\n🔍 However, let\'s verify a sample product:');
  
  const sample = products[0];
  console.log(`\nProduct: ${sample.name}`);
  console.log(`  description: ${sample.description?.substring(0, 50)}...`);
  console.log(`  description_fr: ${sample.description_fr?.substring(0, 50)}...`);
  console.log(`  description_en: ${sample.description_en?.substring(0, 50)}...`);
  
  process.exit(0);
}

console.log('⚠️  Products needing English translations:');
productsNeedingFix.forEach((p, idx) => {
  const missing = [];
  if (!p.description_en) missing.push('description_en');
  if (!p.material_en) missing.push('material_en');
  if (!p.care_en) missing.push('care_en');
  console.log(`  ${idx + 1}. ${p.slug} - Missing: ${missing.join(', ')}`);
});

console.log('\n❓ What would you like to do?');
console.log('  1. Copy from description_fr → description_en (temporary fix)');
console.log('  2. Use simple English placeholders (recommended for manual translation later)');
console.log('  3. Show detailed report and exit');
console.log('\n💡 Run this script with an argument:');
console.log('   node scripts/fix-product-descriptions.mjs copy    # Option 1');
console.log('   node scripts/fix-product-descriptions.mjs placeholder    # Option 2');
console.log('   node scripts/fix-product-descriptions.mjs report    # Option 3');

const action = process.argv[2];

if (!action) {
  process.exit(0);
}

if (action === 'report') {
  console.log('\n📋 Detailed Report:\n');
  productsNeedingFix.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name} (${p.slug})`);
    console.log(`   description_fr: ${p.description_fr || 'NULL'}`);
    console.log(`   description_en: ${p.description_en || '❌ NULL'}`);
    console.log(`   material_fr: ${p.material_fr || 'NULL'}`);
    console.log(`   material_en: ${p.material_en || '❌ NULL'}`);
    console.log(`   care_fr: ${p.care_fr || 'NULL'}`);
    console.log(`   care_en: ${p.care_en || '❌ NULL'}`);
    console.log('');
  });
  process.exit(0);
}

if (action === 'copy') {
  console.log('\n🔄 Copying French text to English fields...\n');
  
  for (const product of productsNeedingFix) {
    const updates = {};
    
    if (!product.description_en && product.description_fr) {
      updates.description_en = product.description_fr;
    }
    if (!product.material_en && product.material_fr) {
      updates.material_en = product.material_fr;
    }
    if (!product.care_en && product.care_fr) {
      updates.care_en = product.care_fr;
    }
    
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${product.slug}:`, updateError);
      } else {
        console.log(`✅ Updated ${product.slug} (${Object.keys(updates).join(', ')})`);
      }
    }
  }
  
  console.log('\n✅ Copy operation completed!');
  console.log('⚠️  Note: You should manually translate these fields to proper English later.');
}

if (action === 'placeholder') {
  console.log('\n📝 Adding English placeholders...\n');
  
  const placeholders = {
    description: 'Premium fashion piece from the Nubia Aura collection. Crafted with care, it combines style, comfort and elegance.',
    material: 'Premium Fabric',
    care: 'Wash in cold water. Iron at medium temperature. Avoid dryer.'
  };
  
  for (const product of productsNeedingFix) {
    const updates = {};
    
    if (!product.description_en) {
      updates.description_en = placeholders.description;
    }
    if (!product.material_en) {
      updates.material_en = placeholders.material;
    }
    if (!product.care_en) {
      updates.care_en = placeholders.care;
    }
    
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${product.slug}:`, updateError);
      } else {
        console.log(`✅ Updated ${product.slug} with placeholders`);
      }
    }
  }
  
  console.log('\n✅ Placeholder operation completed!');
  console.log('⚠️  Note: You should manually translate these fields to proper English later.');
}

console.log('\n✨ Done!');