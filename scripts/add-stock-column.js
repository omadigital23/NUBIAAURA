/**
 * Script pour ajouter la colonne stock à la table products
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addStockColumn() {
  console.log('🔧 Ajout de la colonne stock...\n');

  try {
    // Exécuter la migration SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Ajouter la colonne stock
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;

        -- Mettre à jour les produits existants
        UPDATE products 
        SET stock = 10 
        WHERE stock IS NULL;
      `
    });

    if (error) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', error);
      console.log('\n⚠️ Veuillez exécuter manuellement dans Supabase SQL Editor:');
      console.log(`
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;

UPDATE products 
SET stock = 10 
WHERE stock IS NULL;

ALTER TABLE products 
ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);
      `);
      return;
    }

    console.log('✅ Colonne stock ajoutée avec succès!\n');

    // Vérifier les produits
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, slug, name, stock')
      .limit(5);

    if (fetchError) {
      console.error('❌ Erreur lors de la vérification:', fetchError);
      return;
    }

    console.log('📦 Exemples de produits avec stock:');
    products.forEach(p => {
      console.log(`  - ${p.name}: ${p.stock} articles`);
    });

    console.log('\n✅ Migration terminée!');
    console.log('\n💡 Vous pouvez maintenant mettre à jour le stock de chaque produit dans Supabase.');

  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

addStockColumn();
