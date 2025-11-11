#!/usr/bin/env node

/**
 * Script de démarrage complet pour Nubia Aura
 * Utilisation: npm run setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironment() {
  log('cyan', '🌍 Vérification des variables d\'environnement...');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('red', '❌ Variables manquantes:');
    missing.forEach(key => log('red', `   ${key}=`));
    log('yellow', '\n💡 Créez un fichier .env.local avec ces variables');
    return false;
  }
  
  log('green', '✅ Toutes les variables sont présentes');
  return true;
}

function checkDependencies() {
  log('cyan', '📦 Vérification des dépendances...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const required = ['@supabase/supabase-js', '@supabase/auth-helpers-nextjs'];
  
  const missing = required.filter(dep => !packageJson.dependencies[dep]);
  
  if (missing.length > 0) {
    log('yellow', `📥 Installation des dépendances manquantes: ${missing.join(', ')}`);
    try {
      execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
      log('green', '✅ Dépendances installées');
    } catch (error) {
      log('red', '❌ Erreur lors de l\'installation');
      return false;
    }
  } else {
    log('green', '✅ Toutes les dépendances sont présentes');
  }
  
  return true;
}

function createEnvTemplate() {
  const envPath = '.env.local';
  
  if (fs.existsSync(envPath)) {
    log('green', '✅ Fichier .env.local existe déjà');
    return;
  }
  
  const template = `# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Configuration Flutterwave (optionnel)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key

# Configuration Twilio (optionnel)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=+14155238886
MANAGER_PHONE=+221771234567
MANAGER_EMAIL=manager@nubiaaura.com

# Configuration Redis (optionnel)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token`;

  fs.writeFileSync(envPath, template);
  log('green', `✅ Fichier ${envPath} créé`);
}

function runFixScript() {
  log('cyan', '🔧 Application des corrections...');
  
  try {
    execSync('node scripts/fix-checkout-apis.js', { stdio: 'inherit' });
    log('green', '✅ Corrections appliquées');
  } catch (error) {
    log('red', '❌ Erreur lors de l\'application des corrections');
    return false;
  }
  
  return true;
}

function seedDatabase() {
  log('cyan', '🌱 Remplissage de la base de données...');
  
  try {
    execSync('node scripts/setup-supabase.js', { stdio: 'inherit' });
    log('green', '✅ Base de données remplie');
  } catch (error) {
    log('red', '❌ Erreur lors du remplissage de la base');
    return false;
  }
  
  return true;
}

function testAPIs() {
  log('cyan', '🧪 Test des API...');
  
  try {
    // Test simple avec curl
    const curlCommand = `curl -s -X POST http://localhost:3000/api/checkout/quote \
      -H "Content-Type: application/json" \
      -d '{"locale":"fr","shippingMethod":"standard","items":[{"product_id":"ecb90f0f-a62e-4635-9423-81ee30617568","quantity":1}]}'`;
    
    log('blue', '💡 Pour tester manuellement:');
    log('blue', curlCommand);
    
    return true;
  } catch (error) {
    log('yellow', '⚠️ Test API non disponible - serveur non démarré');
    return true;
  }
}

function showNextSteps() {
  log('magenta', '\n🎯 Prochaines étapes:');
  log('blue', '1. Configurez vos variables dans .env.local');
  log('blue', '2. Lancez: npm run dev');
  log('blue', '3. Ouvrez http://localhost:3000');
  log('blue', '4. Testez l\'ajout au panier et le checkout');
  log('blue', '5. Vérifiez les logs pour [Quote API]');
  
  log('cyan', '\n📚 Commandes utiles:');
  log('white', 'npm run dev          # Démarrer le serveur');
  log('white', 'npm run seed         # Remplir la base de données');
  log('white', 'npm run test-api     # Tester les API');
}

async function main() {
  log('magenta', '🎉 Configuration de Nubia Aura');
  log('magenta', '==============================');
  
  // Étape 1: Vérifier l'environnement
  if (!checkEnvironment()) {
    createEnvTemplate();
    log('yellow', '\n⚠️ Veuillez configurer vos variables d\'environnement avant de continuer');
    return;
  }
  
  // Étape 2: Vérifier les dépendances
  if (!checkDependencies()) {
    return;
  }
  
  // Étape 3: Appliquer les corrections
  if (!runFixScript()) {
    return;
  }
  
  // Étape 4: Remplir la base de données
  if (!seedDatabase()) {
    return;
  }
  
  // Étape 5: Test
  testAPIs();
  
  // Étape 6: Instructions finales
  showNextSteps();
  
  log('green', '\n🎊 Configuration terminée!');
  log('green', 'Votre application est maintenant connectée à Supabase');
}

// Commandes disponibles
const commands = {
  setup: main,
  env: createEnvTemplate,
  deps: checkDependencies,
  seed: seedDatabase,
  fix: runFixScript,
  test: testAPIs
};

if (require.main === module) {
  const command = process.argv[2] || 'setup';
  
  if (commands[command]) {
    commands[command]().catch(console.error);
  } else {
    console.log('Commandes disponibles:');
    Object.keys(commands).forEach(cmd => console.log(`  npm run ${cmd}`));
  }
}

module.exports = { main, checkEnvironment, createEnvTemplate };
