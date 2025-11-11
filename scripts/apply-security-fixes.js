const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applySecurityFixes() {
  console.log('🔒 Application des correctifs de sécurité...\n');

  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'fix_security_issues.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Lecture du fichier fix_security_issues.sql...');
    console.log('⚠️  Note: L\'exécution SQL via l\'API peut ne pas fonctionner.');
    console.log('   Si erreur, exécutez manuellement dans Supabase SQL Editor.\n');

    // Séparer les commandes SQL
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 ${commands.length} commandes SQL à exécuter...\n`);

    // Afficher le SQL pour copier-coller manuel
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('COPIEZ CE CODE DANS SUPABASE SQL EDITOR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(sql);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ ÉTAPES À SUIVRE:');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Cliquez sur "SQL Editor"');
    console.log('   4. Collez le code ci-dessus');
    console.log('   5. Cliquez sur "Run"\n');

    console.log('✅ AUTRES CORRECTIONS (Dashboard):');
    console.log('   6. Authentication > Settings > Enable "Password Protection"');
    console.log('   7. Authentication > Settings > Enable "TOTP" pour MFA\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

applySecurityFixes();
