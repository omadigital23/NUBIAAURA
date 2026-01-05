#!/usr/bin/env node
/**
 * Script de rotation des secrets - NUBIA AURA
 * À exécuter tous les 90 jours pour renouveler les secrets critiques
 * 
 * IMPORTANT: Ce script génère de NOUVEAUX secrets.
 * Vous devez les configurer manuellement dans Vercel et redéployer.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n🔄 NUBIA AURA - Rotation des Secrets\n');
console.log('================================================\n');

// Date du prochain renouvellement (90 jours)
const nextRotation = new Date();
nextRotation.setDate(nextRotation.getDate() + 90);

console.log(`📅 Date actuelle: ${new Date().toLocaleDateString()}`);
console.log(`📅 Prochaine rotation: ${nextRotation.toLocaleDateString()}\n`);

// Générer de nouveaux secrets
const newSecrets = {
    ADMIN_TOKEN_SECRET: crypto.randomBytes(32).toString('hex'),
    SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
};

console.log('🆕 Nouveaux secrets générés:\n');
for (const [key, value] of Object.entries(newSecrets)) {
    console.log(`${key}:`);
    console.log(`  ${value}\n`);
}

// Sauvegarder dans un fichier de rotation
const rotationDir = path.join(__dirname, '..', '.secrets-rotation');
if (!fs.existsSync(rotationDir)) {
    fs.mkdirSync(rotationDir, { recursive: true });
}

const rotationFile = path.join(rotationDir, `rotation-${Date.now()}.json`);
const rotationData = {
    date: new Date().toISOString(),
    nextRotation: nextRotation.toISOString(),
    secrets: Object.keys(newSecrets),
    // NE PAS sauvegarder les valeurs réelles pour la sécurité
    note: 'Les valeurs ont été affichées dans le terminal lors de la génération',
};

fs.writeFileSync(rotationFile, JSON.stringify(rotationData, null, 2));

console.log('📝 Plan de rotation sauvegardé dans:', rotationFile);
console.log('   (Les valeurs réelles ne sont PAS sauvegardées pour la sécurité)\n');

console.log('================================================');
console.log('⚠️  ÉTAPES MANUELLES REQUISES:\n');
console.log('1. Copier les nouveaux secrets ci-dessus');
console.log('2. Configurer dans Vercel:');
for (const key of Object.keys(newSecrets)) {
    console.log(`   vercel env add ${key} production`);
}
console.log('3. Redéployer l\'application: vercel --prod');
console.log('4. Vérifier que tout fonctionne');
console.log('5. Supprimer les anciens secrets de Vercel\n');

console.log('📋 Checklist de rotation:');
console.log('   [ ] Nouveaux secrets générés');
console.log('   [ ] Configurés dans Vercel');
console.log('   [ ] Application redéployée');
console.log('   [ ] Tests de connexion admin réussis');
console.log('   [ ] Anciennes valeurs supprimées');
console.log('   [ ] Calendrier mis à jour (prochaine rotation dans 90j)\n');

console.log('🔔 Ajouter un rappel pour:', nextRotation.toLocaleDateString());
console.log('\n');
