// Script pour mapper les produits aux bonnes catégories
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Mapping des catégories simples aux slugs complets
const categoryMapping = {
  'chemises': 'chemises-wax',
  'costumes': 'costumes-africains',
  'robes': 'robes-mariage', // Par défaut, on peut affiner après
};

async function fixCategories() {
  console.log('🔄 Correction des catégories des produits...\n');

  try {
    // Récupérer tous les produits
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, slug, category, name');
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des produits:', fetchError.message);
      return;
    }

    console.log(`📦 ${products.length} produits trouvés\n`);

    // Grouper les produits par catégorie
    const grouped = {};
    products.forEach(p => {
      if (!grouped[p.category]) {
        grouped[p.category] = [];
      }
      grouped[p.category].push(p);
    });

    console.log('📊 Produits par catégorie:');
    console.log('─'.repeat(50));
    Object.entries(grouped).forEach(([cat, prods]) => {
      console.log(`\n${cat} (${prods.length} produits):`);
      prods.forEach(p => {
        console.log(`  - ${p.slug}: ${p.name}`);
      });
    });
    console.log('\n' + '─'.repeat(50));

    // Appliquer le mapping
    console.log('\n🔄 Application du mapping...\n');
    
    for (const [oldCat, newCat] of Object.entries(categoryMapping)) {
      console.log(`Mise à jour: ${oldCat} → ${newCat}`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ category: newCat })
        .eq('category', oldCat);
      
      if (updateError) {
        console.error(`  ❌ Erreur: ${updateError.message}`);
      } else {
        console.log(`  ✅ Fait`);
      }
    }

    // Vérifier les résultats
    console.log('\n📊 Vérification finale...\n');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('category')
      .order('category');
    
    if (verifyError) {
      console.error('❌ Erreur:', verifyError.message);
    } else {
      const categories = {};
      updatedProducts.forEach(p => {
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

fixCategories();
