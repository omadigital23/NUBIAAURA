#!/usr/bin/env node
/**
 * Script de vérification de sécurité - NUBIA AURA
 * Vérifie que toutes les configurations de sécurité sont correctement en place
 */

const crypto = require('crypto');

console.log('\n🔒 NUBIA AURA - Vérification de Sécurité\n');
console.log('════════════════════════════════════════════════════════════════\n');

const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
};

function check(name, condition, critical = true) {
    if (condition) {
        console.log(`✅ ${name}`);
        results.passed++;
        return true;
    } else if (critical) {
        console.log(`❌ ${name}`);
        results.failed++;
        return false;
    } else {
        console.log(`⚠️  ${name} (optionnel)`);
        results.warnings++;
        return false;
    }
}

console.log('📋 1. Variables d\'environnement Admin\n');

// Vérifier les variables admin
const adminUsername = process.env.ADMIN_USERNAME;
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
const adminSalt = process.env.ADMIN_SALT;
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET;

check('ADMIN_USERNAME défini', !!adminUsername);
check('ADMIN_PASSWORD_HASH défini', !!adminPasswordHash);
check('ADMIN_SALT défini', !!adminSalt);
check('ADMIN_TOKEN_SECRET défini', !!adminTokenSecret);

// Vérifier la force du token secret
if (adminTokenSecret) {
    check('ADMIN_TOKEN_SECRET ≥ 32 caractères (256 bits)', adminTokenSecret.length >= 32);
    check('ADMIN_TOKEN_SECRET n\'est pas "default" ou placeholder',
        !adminTokenSecret.toLowerCase().includes('default') &&
        !adminTokenSecret.includes('your_') &&
        !adminTokenSecret.includes('xxx'));
}

// Vérifier le hash PBKDF2
if (adminPasswordHash) {
    check('ADMIN_PASSWORD_HASH format hex (128 chars pour SHA-512)',
        /^[a-f0-9]{128}$/i.test(adminPasswordHash));
}

console.log('\n📋 2. Variables Supabase\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

check('NEXT_PUBLIC_SUPABASE_URL défini', !!supabaseUrl);
check('NEXT_PUBLIC_SUPABASE_ANON_KEY défini', !!supabaseAnonKey);
check('SUPABASE_SERVICE_ROLE_KEY défini', !!supabaseServiceKey);

// Vérifier que SERVICE_ROLE_KEY n'est pas dans NEXT_PUBLIC
if (supabaseServiceKey) {
    check('SERVICE_ROLE_KEY n\'est pas exposé côté client',
        !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
}

console.log('\n📋 3. Configuration de Sécurité\n');

// Rate limiting
const upstashRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const enableRateLimiting = process.env.ENABLE_RATE_LIMITING;

check('UPSTASH_REDIS_REST_URL défini (rate limiting)', !!upstashRedisUrl, false);
check('UPSTASH_REDIS_REST_TOKEN défini', !!upstashRedisToken, false);
check('ENABLE_RATE_LIMITING activé', enableRateLimiting === 'true', false);

// Sentry
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

check('SENTRY_DSN configuré (error monitoring)', !!sentryDsn, false);

console.log('\n📋 4. Sécurité du Code\n');

// Vérifier l'existence des fichiers de sécurité critiques
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const securityFiles = [
    'lib/auth-admin.ts',
    'lib/rate-limit-upstash.ts',
    'lib/sanitize.ts',
    'supabase/migrations/20260104_enable_rls_all_tables.sql',
    'scripts/generate-secrets.js',
    'scripts/rotate-secrets.js',
    'docs/ADMIN_2FA_GUIDE.md',
    'SECURITY.md',
];

securityFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    check(`Fichier ${file} existe`, fs.existsSync(fullPath));
});

console.log('\n📋 5. Configuration de Production\n');

const nodeEnv = process.env.NODE_ENV;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

check('NODE_ENV est défini', !!nodeEnv);

if (nodeEnv === 'production') {
    console.log('  → Mode production détecté, vérifications supplémentaires:\n');

    check('NEXT_PUBLIC_APP_URL est HTTPS',
        appUrl && appUrl.startsWith('https://'));

    check('Pas de clés de test en production',
        !adminTokenSecret?.includes('test') &&
        !supabaseUrl?.includes('localhost'));
}

// Résumé
console.log('\n════════════════════════════════════════════════════════════════');
console.log('\n📊 RÉSUMÉ DE LA VÉRIFICATION\n');
console.log(`   ✅ Tests réussis    : ${results.passed}`);
console.log(`   ❌ Tests échoués    : ${results.failed}`);
console.log(`   ⚠️  Avertissements  : ${results.warnings}`);

const score = Math.round((results.passed / (results.passed + results.failed)) * 10);
console.log(`\n   🎯 Score de Sécurité: ${score}/10`);

if (results.failed === 0) {
    console.log('\n   🏆 Toutes les vérifications critiques sont passées!\n');
} else {
    console.log('\n   ⚠️  Corrigez les erreurs ci-dessus avant le déploiement.\n');
    console.log('   📚 Consultez SECURITY.md et docs/ADMIN_2FA_GUIDE.md\n');
}

// Recommandations
if (results.failed > 0 || results.warnings > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n💡 RECOMMANDATIONS\n');

    if (!adminTokenSecret || adminTokenSecret.length < 32) {
        console.log('   1. Générer un nouveau secret JWT:');
        console.log('      npm run security:generate-secrets\n');
    }

    if (!upstashRedisUrl) {
        console.log('   2. Configurer le rate limiting avec Upstash:');
        console.log('      https://upstash.com/ (gratuit jusqu\'à 10k requêtes/jour)\n');
    }

    if (!sentryDsn) {
        console.log('   3. Configurer Sentry pour le monitoring d\'erreurs:');
        console.log('      https://sentry.io/\n');
    }
}

// Exit code
process.exit(results.failed > 0 ? 1 : 0);
