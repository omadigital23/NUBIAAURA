const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigrations() {
  console.log('🚀 Exécution des migrations SQL...\n');

  const migrations = [
    {
      name: 'add_stock_column.sql',
      description: 'Ajouter la colonne stock aux produits'
    },
    {
      name: 'add_first_last_name.sql',
      description: 'Ajouter first_name et last_name aux users'
    },
    {
      name: 'fix_security_issues.sql',
      description: 'Corriger les problèmes de sécurité'
    }
  ];

  for (const migration of migrations) {
    console.log(`\n📄 Migration: ${migration.name}`);
    console.log(`   ${migration.description}`);
    
    try {
      const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', migration.name);
      
      if (!fs.existsSync(sqlPath)) {
        console.log(`   ⚠️  Fichier non trouvé, ignoré`);
        continue;
      }

      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Séparer les commandes SQL
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));

      console.log(`   📝 ${commands.length} commandes à exécuter...`);

      // Exécuter chaque commande
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        if (cmd.length < 10) continue; // Ignorer les commandes trop courtes

        try {
          // Utiliser l'API REST de Supabase
          const { error } = await supabase.rpc('exec', { sql: cmd + ';' });
          
          if (error) {
            // Si RPC ne fonctionne pas, afficher pour exécution manuelle
            console.log(`   ⚠️  Commande ${i + 1}: Exécution manuelle requise`);
          } else {
            console.log(`   ✅ Commande ${i + 1}: OK`);
          }
        } catch (err) {
          console.log(`   ⚠️  Commande ${i + 1}: ${err.message}`);
        }
      }

      console.log(`   ✅ Migration ${migration.name} terminée`);

    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  EXÉCUTION MANUELLE REQUISE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('L\'API Supabase ne permet pas d\'exécuter du SQL arbitraire.');
  console.log('Veuillez exécuter manuellement dans Supabase SQL Editor:\n');
  
  console.log('1️⃣ STOCK COLUMN:');
  console.log('   ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;');
  console.log('   UPDATE products SET stock = 10 WHERE stock IS NULL;\n');

  console.log('2️⃣ FIRST/LAST NAME:');
  console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;');
  console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;');
  console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;\n');

  console.log('3️⃣ SECURITY FIX:');
  console.log('   DROP FUNCTION IF EXISTS public.products_sync_image();');
  console.log('   CREATE OR REPLACE FUNCTION public.products_sync_image()');
  console.log('   RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER');
  console.log('   SET search_path = public, pg_temp AS $$');
  console.log('   BEGIN');
  console.log('     IF NEW.image IS NULL OR NEW.image = \'\' THEN');
  console.log('       NEW.image := NEW.image_url;');
  console.log('     END IF;');
  console.log('     IF NEW.image_url IS NULL OR NEW.image_url = \'\' THEN');
  console.log('       NEW.image_url := NEW.image;');
  console.log('     END IF;');
  console.log('     RETURN NEW;');
  console.log('   END; $$;');
  console.log('   CREATE TRIGGER products_sync_image_trigger');
  console.log('   BEFORE INSERT OR UPDATE ON products FOR EACH ROW');
  console.log('   EXECUTE FUNCTION public.products_sync_image();\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Allez sur: https://supabase.com/dashboard');
  console.log('✅ SQL Editor > Collez les commandes ci-dessus');
  console.log('✅ Cliquez sur "Run"\n');
}

executeMigrations().catch(console.error);
