// Mettre à jour les images super100 avec votre image personnalisée
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateSuper100Images() {
  console.log('🖼️  Mise à jour des images Super100...\n');

  try {
    // Récupérer les produits super100 pour voir leurs images actuelles
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, slug, image')
      .eq('category', 'super100');
    
    if (fetchError) {
      console.error('❌ Erreur:', fetchError.message);
      return;
    }

    console.log(`📦 Images actuelles des produits Super100:\n`);
    products.forEach(p => {
      console.log(`${p.slug}:`);
      console.log(`  ${p.image}\n`);
    });

    console.log('─'.repeat(80));
    console.log('\n💡 Pour utiliser votre image super100:');
    console.log('1. Uploadez votre image sur Supabase Storage (bucket: products)');
    console.log('2. Copiez l\'URL publique');
    console.log('3. Exécutez ce script avec l\'URL en paramètre\n');
    console.log('Exemple:');
    console.log('  node update-super100-image.js "https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/super100.png"\n');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

// Si une URL est fournie en paramètre, mettre à jour
const imageUrl = process.argv[2];

if (imageUrl) {
  console.log(`🔄 Mise à jour avec l'image: ${imageUrl}\n`);
  
  (async () => {
    try {
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, slug')
        .eq('category', 'super100');
      
      if (fetchError) {
        console.error('❌ Erreur:', fetchError.message);
        return;
      }

      for (const product of products) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ image: imageUrl })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`❌ ${product.slug}: ${updateError.message}`);
        } else {
          console.log(`✅ ${product.slug} - Image mise à jour`);
        }
      }

      console.log('\n✅ Images mises à jour!\n');
    } catch (err) {
      console.error('❌ Erreur:', err.message);
    }
  })();
} else {
  updateSuper100Images();
}
