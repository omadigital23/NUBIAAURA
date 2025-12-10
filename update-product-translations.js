// Mettre à jour les traductions des produits
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Traductions des produits
const productTranslations = {
  'costume-blanc': {
    name_en: 'White Costume',
    description_en: 'Premium fashion piece from the Nubia Aura collection. Crafted with care, it combines style, comfort and elegance.',
  },
  'costume-vert': {
    name_en: 'Green Costume',
    description_en: 'Premium fashion piece from the Nubia Aura collection. Crafted with care, it combines style, comfort and elegance.',
  },
  'super100-bleu': {
    name_en: 'Super100 Blue',
    description_en: 'Premium quality Super 100 pants. Comfortable and elegant for everyday wear.',
  },
  'super100-noir': {
    name_en: 'Super100 Black',
    description_en: 'Premium quality Super 100 pants. Comfortable and elegant for everyday wear.',
  },
  'chemise-wax-grande': {
    name_en: 'Large Wax Shirt',
    description_en: 'Large wax shirt with traditional African patterns. Versatile, it can be worn alone or as part of an ensemble for a unique style.',
  },
  'robe-mariage-courte-ivoire': {
    name_en: 'Short Ivory Wedding Dress',
    description_en: 'Elegant short wedding dress in ivory. Perfect for your special day with style and sophistication.',
  },
  'robe-mariage-longue-blanche': {
    name_en: 'Long White Wedding Dress',
    description_en: 'Elegant long wedding dress in white. Perfect for your special day with style and sophistication.',
  },
  'robe-soiree-courte-bleue': {
    name_en: 'Short Blue Evening Dress',
    description_en: 'Stunning short evening dress in blue. Perfect for special occasions with elegance and charm.',
  },
  'robe-soiree-courte-rose': {
    name_en: 'Short Pink Evening Dress',
    description_en: 'Stunning short evening dress in pink. Perfect for special occasions with elegance and charm.',
  },
  'robe-soiree-longue-doree': {
    name_en: 'Long Gold Evening Dress',
    description_en: 'Stunning long evening dress in gold. Perfect for special occasions with elegance and charm.',
  },
  'robe-soiree-longue-noire': {
    name_en: 'Long Black Evening Dress',
    description_en: 'Stunning long evening dress in black. Perfect for special occasions with elegance and charm.',
  },
  'robe-soiree-longue-rouge-classique': {
    name_en: 'Long Classic Red Evening Dress',
    description_en: 'Stunning long evening dress in classic red. Perfect for special occasions with elegance and charm.',
  },
  'robe-soiree-longue-rouge-elegante': {
    name_en: 'Long Elegant Red Evening Dress',
    description_en: 'Stunning long evening dress in elegant red. Perfect for special occasions with elegance and charm.',
  },
  'robe-ville-courte-noire': {
    name_en: 'Short Black City Dress',
    description_en: 'Chic short city dress in black. Modern and comfortable for all your daily outings.',
  },
  'robe-ville-longue-blanche': {
    name_en: 'Long White City Dress',
    description_en: 'Chic long city dress in white. Modern and comfortable for all your daily outings.',
  },
  'robe-wax-courte': {
    name_en: 'Short Wax Dress',
    description_en: 'Beautiful short wax dress with traditional African patterns. Perfect for a unique and authentic style.',
  },
  'robe-wax-longue': {
    name_en: 'Long Wax Dress',
    description_en: 'Beautiful long wax dress with traditional African patterns. Perfect for a unique and authentic style.',
  },
};

async function updateTranslations() {
  console.log('🌐 Mise à jour des traductions anglaises des produits...\n');

  try {
    let updated = 0;
    let failed = 0;

    for (const [slug, translations] of Object.entries(productTranslations)) {
      try {
        const { error } = await supabase
          .from('products')
          .update(translations)
          .eq('slug', slug);

        if (error) {
          console.error(`❌ ${slug}: ${error.message}`);
          failed++;
        } else {
          console.log(`✅ ${slug}`);
          updated++;
        }
      } catch (err) {
        console.error(`❌ ${slug}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`✅ Mis à jour: ${updated}`);
    console.log(`❌ Échoués: ${failed}`);
    console.log(`\n✅ Traductions anglaises ajoutées!\n`);

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

updateTranslations();
