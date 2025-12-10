// Corriger les données super100
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixSuper100Data() {
  console.log('🔧 Correction des données Super100...\n');

  try {
    // Nouvelles données pour super100
    const newData = {
      price: 10000,
      description: 'Pantalon Super 100 de qualité premium. Confortable et élégant pour un usage quotidien.',
      description_fr: 'Pantalon Super 100 de qualité premium. Confortable et élégant pour un usage quotidien.',
      description_en: 'Premium quality Super 100 pants. Comfortable and elegant for everyday wear.',
    };

    // Récupérer les produits super100
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, slug')
      .eq('category', 'super100');
    
    if (fetchError) {
      console.error('❌ Erreur:', fetchError.message);
      return;
    }

    console.log(`📦 ${products.length} produits à mettre à jour\n`);

    // Mettre à jour chaque produit
    for (const product of products) {
      const { error: updateError } = await supabase
        .from('products')
        .update(newData)
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ ${product.slug}: ${updateError.message}`);
      } else {
        console.log(`✅ ${product.slug}`);
        console.log(`   Prix: 75000 FCFA → 10000 FCFA`);
        console.log(`   Description: "Costume Super 100..." → "Pantalon Super 100..."`);
      }
    }

    // Vérifier les résultats
    console.log('\n📊 Vérification finale...\n');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('slug, price, description')
      .eq('category', 'super100');
    
    if (verifyError) {
      console.error('❌ Erreur:', verifyError.message);
    } else {
      console.log('✅ Données mises à jour:');
      console.log('─'.repeat(60));
      updatedProducts.forEach(p => {
        console.log(`${p.slug}`);
        console.log(`  Prix: ${p.price} FCFA`);
        console.log(`  Description: ${p.description}`);
      });
      console.log('─'.repeat(60));
      console.log('\n✅ Correction terminée!\n');
    }

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

fixSuper100Data();
