// Script intelligent pour mapper les produits aux bonnes catégories basé sur le nom
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Fonction pour déterminer la catégorie basée sur le nom du produit
function determineCategoryFromName(name, slug) {
  const lowerName = name.toLowerCase();
  const lowerSlug = slug.toLowerCase();

  // Chemises
  if (lowerName.includes('chemise') || lowerSlug.includes('chemise')) {
    return 'chemises-wax';
  }

  // Costumes
  if (lowerName.includes('costume') || lowerName.includes('super100') || lowerSlug.includes('super100')) {
    return 'costumes-africains';
  }

  // Robes de mariage
  if (lowerName.includes('mariage')) {
    return 'robes-mariage';
  }

  // Robes de soirée
  if (lowerName.includes('soiree') || lowerName.includes('soirée')) {
    return 'robes-soiree';
  }

  // Robes de ville
  if (lowerName.includes('ville')) {
    return 'robes-ville';
  }

  // Robes wax
  if (lowerName.includes('wax') && lowerName.includes('robe')) {
    return 'robes-wax';
  }

  // Par défaut
  return 'robes-mariage';
}

async function smartFixCategories() {
  console.log('🧠 Correction intelligente des catégories...\n');

  try {
    // Récupérer tous les produits
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, slug, category, name');
    
    if (fetchError) {
      console.error('❌ Erreur:', fetchError.message);
      return;
    }

    console.log(`📦 ${products.length} produits à traiter\n`);

    // Créer un plan de mise à jour
    const updates = [];
    products.forEach(p => {
      const newCategory = determineCategoryFromName(p.name, p.slug);
      if (newCategory !== p.category) {
        updates.push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          oldCategory: p.category,
          newCategory: newCategory
        });
      }
    });

    console.log(`📋 ${updates.length} produits à mettre à jour\n`);
    console.log('Détails des mises à jour:');
    console.log('─'.repeat(70));

    updates.forEach(u => {
      console.log(`${u.slug.padEnd(30)} : ${u.oldCategory.padEnd(20)} → ${u.newCategory}`);
    });

    console.log('─'.repeat(70));

    // Appliquer les mises à jour
    console.log('\n🔄 Application des mises à jour...\n');
    
    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({ category: update.newCategory })
        .eq('id', update.id);
      
      if (error) {
        console.error(`❌ ${update.slug}: ${error.message}`);
      } else {
        console.log(`✅ ${update.slug}`);
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

smartFixCategories();
