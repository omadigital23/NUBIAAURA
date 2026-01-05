#!/usr/bin/env node
/**
 * Script de génération de secrets sécurisés pour NUBIA AURA
 * Génère des secrets cryptographiquement forts pour l'admin et autres services
 */

const crypto = require('crypto');

console.log('\n🔐 NUBIA AURA - Générateur de Secrets Sécurisés\n');
console.log('================================================\n');

/**
 * Génère un secret aléatoire sécurisé
 */
function generateSecret(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Génère un hash PBKDF2 pour un mot de passe
 */
function generatePasswordHash(password) {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

    return { hash, salt };
}

// 1. Admin Token Secret (pour JWT)
const adminTokenSecret = generateSecret(32); // 256 bits
console.log('1. ADMIN_TOKEN_SECRET (JWT signing key):');
console.log(`   ${adminTokenSecret}\n`);

// 2. Admin Salt (si pas déjà généré)
const adminSalt = generateSecret(32);
console.log('2. ADMIN_SALT (pour hash PBKDF2):');
console.log(`   ${adminSalt}\n`);

// 3. Exemple de hash pour un mot de passe admin
const examplePassword = 'ChangeMe123!'; // Remplacer par le vrai mot de passe
const { hash: adminHash, salt: exampleSalt } = generatePasswordHash(examplePassword);
console.log('3. Exemple de hash ADMIN_PASSWORD (utilisez le salt ci-dessus):');
console.log(`   Password: "${examplePassword}"`);
console.log(`   Hash: ${adminHash}`);
console.log(`   ⚠️  Utilisez ADMIN_SALT mentionné ci-dessus, pas celui-ci: ${exampleSalt}\n`);

// 4. Session Secret (si besoin)
const sessionSecret = generateSecret(32);
console.log('4. SESSION_SECRET (optionnel):');
console.log(`   ${sessionSecret}\n`);

// 5. Encryption Key (pour données sensibles)
const encryptionKey = generateSecret(32);
console.log('5. ENCRYPTION_KEY (optionnel, pour chiffrement AES-256):');
console.log(`   ${encryptionKey}\n`);

console.log('================================================\n');
console.log('⚠️  IMPORTANT - Sécurité des Secrets:');
console.log('   1. Ne JAMAIS committer ces secrets dans Git');
console.log('   2. Stocker dans .env.local (qui est dans .gitignore)');
console.log('   3. Utiliser des secrets DIFFÉRENTS pour dev/staging/prod');
console.log('   4. Configurer dans Vercel: vercel env add ADMIN_TOKEN_SECRET');
console.log('   5. Rotation recommandée tous les 90 jours\n');

console.log('📝 Copier ces valeurs dans votre fichier .env.local\n');

// Générer un template .env
console.log('# ==========================================');
console.log('# Admin Configuration - Generated Secrets');
console.log('# Date:', new Date().toISOString());
console.log('# ==========================================');
console.log(`ADMIN_USERNAME=admin`);
console.log(`ADMIN_PASSWORD_HASH=${adminHash}`);
console.log(`ADMIN_SALT=${adminSalt}`);
console.log(`ADMIN_TOKEN_SECRET=${adminTokenSecret}`);
console.log('');
console.log('# Optionnel');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('');
