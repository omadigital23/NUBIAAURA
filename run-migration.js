// Script pour exécuter la migration SQL via Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log('🔄 Exécution de la migration...\n');

  try {
    // 1. Update products with category 'ready-to-wear' to 'robes-ville'
    console.log('1️⃣  Mise à jour des produits: ready-to-wear → robes-ville');
    const { data: data1, error: error1 } = await supabase
      .from('products')
      .update({ category: 'robes-ville' })
      .eq('category', 'ready-to-wear');
    
    if (error1) {
      console.error('❌ Erreur:', error1.message);
    } else {
      console.log('✅ Fait\n');
    }

    // 2. Update products with category 'custom' to 'robes-mariage'
    console.log('2️⃣  Mise à jour des produits: custom → robes-mariage');
    const { data: data2, error: error2 } = await supabase
      .from('products')
      .update({ category: 'robes-mariage' })
      .eq('category', 'custom');
    
    if (error2) {
      console.error('❌ Erreur:', error2.message);
    } else {
      console.log('✅ Fait\n');
    }

    // 3. Verify the changes
    console.log('3️⃣  Vérification des catégories...\n');
    const { data: products, error: error3 } = await supabase
      .from('products')
      .select('category')
      .order('category');
    
    if (error3) {
      console.error('❌ Erreur:', error3.message);
    } else {
      // Group by category and count
      const categories = {};
      products.forEach(p => {
        categories[p.category] = (categories[p.category] || 0) + 1;
      });

      console.log('📊 Résumé des catégories:');
      console.log('─'.repeat(40));
      Object.entries(categories)
        .sort()
        .forEach(([cat, count]) => {
          console.log(`  ${cat.padEnd(20)} : ${count} produit(s)`);
        });
      console.log('─'.repeat(40));
      console.log(`\n✅ Migration terminée avec succès!\n`);
    }

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

runMigration();
