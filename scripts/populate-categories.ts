import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping des catégories avec traductions
const categoriesData = [
  {
    slug: 'chemises-wax',
    name: 'Chemises Wax',
    name_fr: 'Chemises Wax',
    name_en: 'Wax Shirts',
  },
  {
    slug: 'costumes-africains',
    name: 'Costumes Africains',
    name_fr: 'Costumes Africains',
    name_en: 'African Costumes',
  },
  {
    slug: 'robes-mariage',
    name: 'Robes de Mariage',
    name_fr: 'Robes de Mariage',
    name_en: 'Wedding Dresses',
  },
  {
    slug: 'robes-soiree',
    name: 'Robes de Soirée',
    name_fr: 'Robes de Soirée',
    name_en: 'Evening Dresses',
  },
  {
    slug: 'robes-ville',
    name: 'Robes de Ville',
    name_fr: 'Robes de Ville',
    name_en: 'City Dresses',
  },
  {
    slug: 'robes-wax',
    name: 'Robes Wax',
    name_fr: 'Robes Wax',
    name_en: 'Wax Dresses',
  },
  {
    slug: 'super100',
    name: 'Super 100',
    name_fr: 'Super 100',
    name_en: 'Super 100',
  },
];

async function populateCategories() {
  try {
    console.log('🔄 Populating categories table...');

    // Supprimer les catégories existantes
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('❌ Error deleting existing categories:', deleteError);
      return;
    }

    // Insérer les nouvelles catégories
    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesData)
      .select();

    if (error) {
      console.error('❌ Error inserting categories:', error);
      return;
    }

    console.log('✅ Categories populated successfully:');
    data?.forEach((cat) => {
      console.log(`   - ${cat.slug}: ${cat.name_fr} (${cat.name_en})`);
    });
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

populateCategories();
