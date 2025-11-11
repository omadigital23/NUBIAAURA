// Test d'un produit spécifique
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProduct() {
  const slug = 'costume-vert';
  
  console.log(`\n🔍 Test du produit: ${slug}\n`);
  
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, name_fr, name_en, description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en')
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }
  
  if (!data) {
    console.log('❌ Produit non trouvé');
    return;
  }
  
  console.log('✅ Produit trouvé!\n');
  console.log('📝 NOM:');
  console.log(`  FR: ${data.name_fr || '❌'}`);
  console.log(`  EN: ${data.name_en || '❌'}`);
  
  console.log('\n📄 DESCRIPTION:');
  console.log(`  FR: ${data.description_fr || '❌'}`);
  console.log(`  EN: ${data.description_en || '❌'}`);
  
  console.log('\n🧵 MATERIAL:');
  console.log(`  FR: ${data.material_fr || '❌'}`);
  console.log(`  EN: ${data.material_en || '❌'}`);
  
  console.log('\n🧼 CARE:');
  console.log(`  FR: ${data.care_fr || '❌'}`);
  console.log(`  EN: ${data.care_en || '❌'}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RÉSULTAT:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (data.description_en) {
    console.log('✅ description_en existe!');
    console.log(`   Contenu: "${data.description_en}"`);
  } else {
    console.log('❌ description_en est vide/null!');
  }
}

testProduct().catch(console.error);
