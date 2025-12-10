// Vérifier les données super100
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkSuper100() {
  console.log('🔍 Vérification des produits Super100...\n');

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'super100');
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }

    console.log(`📦 ${products.length} produits Super100 trouvés:\n`);
    products.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Nom: ${p.name}`);
      console.log(`Slug: ${p.slug}`);
      console.log(`Prix: ${p.price} FCFA`);
      console.log(`Description: ${p.description}`);
      console.log(`Image: ${p.image}`);
      console.log('─'.repeat(60));
    });

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

checkSuper100();
