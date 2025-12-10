const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSecurity() {
  console.log('🔍 Vérification de la sécurité Supabase...\n');

  // 1. Vérifier la fonction products_sync_image
  console.log('1️⃣ Vérification de la fonction products_sync_image...');
  
  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('*')
    .eq('proname', 'products_sync_image')
    .limit(1);

  if (funcError) {
    console.log('⚠️  Impossible de vérifier les fonctions via l\'API');
    console.log('   Vérifiez manuellement dans le Dashboard Supabase\n');
  } else if (functions && functions.length > 0) {
    console.log('✅ Fonction products_sync_image trouvée');
    console.log('   Exécutez fix_security_issues.sql pour la corriger\n');
  } else {
    console.log('ℹ️  Fonction products_sync_image non trouvée\n');
  }

  // 2. Instructions pour les autres corrections
  console.log('2️⃣ Protection mots de passe compromis:');
  console.log('   ⚠️  À activer manuellement dans Dashboard > Authentication > Settings');
  console.log('   ☑ Enable "Check passwords against HaveIBeenPwned.org"\n');

  console.log('3️⃣ Multi-Factor Authentication (MFA):');
  console.log('   ⚠️  À activer manuellement dans Dashboard > Authentication > Settings');
  console.log('   ☑ Enable TOTP (Time-based One-Time Password)');
  console.log('   ☑ Enable Email OTP (optionnel)');
  console.log('   ☑ Enable SMS (si Twilio configuré)\n');

  console.log('📝 ACTIONS À FAIRE:');
  console.log('   1. Exécutez: supabase/migrations/fix_security_issues.sql');
  console.log('   2. Dashboard > Authentication > Settings > Enable Password Protection');
  console.log('   3. Dashboard > Authentication > Settings > Enable MFA options');
  console.log('\n✅ Consultez SUPABASE_SECURITY_FIX.txt pour les détails');
}

checkSecurity().catch(console.error);
