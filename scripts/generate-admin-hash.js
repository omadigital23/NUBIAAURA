#!/usr/bin/env node

/**
 * Script pour générer un hash sécurisé pour les identifiants admin
 * 
 * Usage:
 *   node scripts/generate-admin-hash.js "your_password"
 * 
 * Output:
 *   ADMIN_PASSWORD_HASH=...
 *   ADMIN_SALT=...
 */

const crypto = require('crypto');

function generateAdminHash(password) {
  if (!password) {
    console.error('❌ Erreur: Veuillez fournir un mot de passe');
    console.log('\nUsage: node scripts/generate-admin-hash.js "your_password"');
    process.exit(1);
  }

  // Générer un salt aléatoire
  const salt = crypto.randomBytes(32).toString('hex');
  
  // Générer le hash avec PBKDF2
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');

  console.log('\n✅ Hash généré avec succès!\n');
  console.log('Ajoutez ces variables à votre fichier .env.local:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`ADMIN_SALT=${salt}\n`);
  
  console.log('⚠️  IMPORTANT:');
  console.log('1. Ne partagez JAMAIS le mot de passe en clair');
  console.log('2. Stockez le hash et le salt dans .env.local (pas en clair)');
  console.log('3. Ajoutez .env.local à .gitignore\n');
}

const password = process.argv[2];
generateAdminHash(password);
