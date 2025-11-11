// Test des données produits EN dans Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProductData() {
  console.log('🔍 Test des données produits...\n');
  
  // Récupérer un produit au hasard
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name, name_fr, name_en, description, description_fr, description_en, material, material_fr, material_en, care, care_fr, care_en')
    .limit(3);
  
  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('❌ Aucun produit trouvé');
    return;
  }
  
  console.log(`✅ ${products.length} produits récupérés\n`);
  
  products.forEach((product, index) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 PRODUIT ${index + 1}: ${product.slug}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // Nom
    console.log('\n📝 NOM:');
    console.log(`  FR: ${product.name_fr || '❌ MANQUANT'}`);
    console.log(`  EN: ${product.name_en || '❌ MANQUANT'}`);
    console.log(`  Défaut: ${product.name || '❌ MANQUANT'}`);
    
    // Description
    console.log('\n📄 DESCRIPTION:');
    console.log(`  FR: ${product.description_fr ? '✅ ' + product.description_fr.substring(0, 50) + '...' : '❌ MANQUANT'}`);
    console.log(`  EN: ${product.description_en ? '✅ ' + product.description_en.substring(0, 50) + '...' : '❌ MANQUANT'}`);
    console.log(`  Défaut: ${product.description ? '✅ ' + product.description.substring(0, 50) + '...' : '❌ MANQUANT'}`);
    
    // Material
    console.log('\n🧵 MATERIAL:');
    console.log(`  FR: ${product.material_fr || '❌ MANQUANT'}`);
    console.log(`  EN: ${product.material_en || '❌ MANQUANT'}`);
    console.log(`  Défaut: ${product.material || '❌ MANQUANT'}`);
    
    // Care
    console.log('\n🧼 CARE:');
    console.log(`  FR: ${product.care_fr ? '✅ ' + product.care_fr.substring(0, 40) + '...' : '❌ MANQUANT'}`);
    console.log(`  EN: ${product.care_en ? '✅ ' + product.care_en.substring(0, 40) + '...' : '❌ MANQUANT'}`);
    console.log(`  Défaut: ${product.care ? '✅ ' + product.care.substring(0, 40) + '...' : '❌ MANQUANT'}`);
    
    console.log('\n');
  });
  
  // Statistiques
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 STATISTIQUES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const stats = {
    name_en: products.filter(p => p.name_en).length,
    description_en: products.filter(p => p.description_en).length,
    material_en: products.filter(p => p.material_en).length,
    care_en: products.filter(p => p.care_en).length,
  };
  
  console.log(`\n✅ Produits avec name_en: ${stats.name_en}/${products.length}`);
  console.log(`✅ Produits avec description_en: ${stats.description_en}/${products.length}`);
  console.log(`✅ Produits avec material_en: ${stats.material_en}/${products.length}`);
  console.log(`✅ Produits avec care_en: ${stats.care_en}/${products.length}`);
  
  if (stats.description_en === products.length) {
    console.log('\n🎉 TOUS LES PRODUITS ONT DES DESCRIPTIONS EN!');
  } else {
    console.log(`\n⚠️ ${products.length - stats.description_en} produits sans description_en`);
  }
}

testProductData().catch(console.error);
