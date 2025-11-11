// Script pour corriger la catégorie super100
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixSuper100() {
  console.log('🔄 Correction de la catégorie Super100...\n');

  try {
    // Récupérer les produits super100
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, slug, name, category')
      .or('slug.ilike.%super100%,name.ilike.%super100%');
    
    if (fetchError) {
      console.error('❌ Erreur:', fetchError.message);
      return;
    }

    console.log(`📦 ${products.length} produits Super100 trouvés:\n`);
    products.forEach(p => {
      console.log(`  - ${p.slug}: ${p.name} (catégorie actuelle: ${p.category})`);
    });

    // Mettre à jour les produits super100
    console.log('\n🔄 Mise à jour vers la catégorie "super100"...\n');
    
    for (const product of products) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ category: 'super100' })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ ${product.slug}: ${updateError.message}`);
      } else {
        console.log(`✅ ${product.slug} → super100`);
      }
    }

    // Vérifier les résultats
    console.log('\n📊 Vérification finale...\n');
    const { data: finalProducts, error: verifyError } = await supabase
      .from('products')
      .select('category')
      .order('category');
    
    if (verifyError) {
      console.error('❌ Erreur:', verifyError.message);
    } else {
      const categories = {};
      finalProducts.forEach(p => {
        categories[p.category] = (categories[p.category] || 0) + 1;
      });

      console.log('✅ Catégories finales:');
      console.log('─'.repeat(40));
      Object.entries(categories)
        .sort()
        .forEach(([cat, count]) => {
          console.log(`  ${cat.padEnd(25)} : ${count} produit(s)`);
        });
      console.log('─'.repeat(40));
      console.log('\n✅ Correction terminée!\n');
    }

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

fixSuper100();
