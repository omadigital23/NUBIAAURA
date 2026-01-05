#!/usr/bin/env node
/**
 * Script de Configuration Vercel Automatisée - NUBIA AURA
 * Génère les commandes pour configurer toutes les variables d'environnement en production
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🚀 NUBIA AURA - Configuration Production Vercel\n');
console.log('════════════════════════════════════════════════════════════════\n');

console.log('Ce script va vous guider pour configurer toutes les variables');
console.log('d\'environnement nécessaires pour la production.\n');

console.log('⚠️  IMPORTANT:');
console.log('   1. Assurez-vous d\'avoir généré les secrets: npm run security:generate-secrets');
console.log('   2. Ayez vos clés Supabase à portée de main');
console.log('   3. Les commandes générées seront à exécuter manuellement\n');

// Configuration
const config = {
    admin: {},
    supabase: {},
    app: {},
    optional: {}
};

// Questions
const questions = [
    // Admin
    { key: 'admin.username', prompt: 'ADMIN_USERNAME (ex: admin): ', required: true },
    { key: 'admin.passwordHash', prompt: 'ADMIN_PASSWORD_HASH (généré par generate-secrets): ', required: true },
    { key: 'admin.salt', prompt: 'ADMIN_SALT (généré par generate-secrets): ', required: true },
    { key: 'admin.tokenSecret', prompt: 'ADMIN_TOKEN_SECRET (généré par generate-secrets): ', required: true },

    // Supabase
    { key: 'supabase.url', prompt: 'NEXT_PUBLIC_SUPABASE_URL (https://xxx.supabase.co): ', required: true },
    { key: 'supabase.anonKey', prompt: 'NEXT_PUBLIC_SUPABASE_ANON_KEY: ', required: true },
    { key: 'supabase.serviceKey', prompt: 'SUPABASE_SERVICE_ROLE_KEY: ', required: true },

    // App
    { key: 'app.url', prompt: 'NEXT_PUBLIC_APP_URL (https://votre-domaine.com): ', required: true },

    // Optional
    { key: 'optional.2faEnabled', prompt: '2FA activé? (true/false) [Optionnel, Enter pour passer]: ', required: false },
    { key: 'optional.2faSecret', prompt: 'ADMIN_2FA_SECRET (si 2FA activé): ', required: false },
    { key: 'optional.upstashUrl', prompt: 'UPSTASH_REDIS_REST_URL [Optionnel]: ', required: false },
    { key: 'optional.upstashToken', prompt: 'UPSTASH_REDIS_REST_TOKEN [Optionnel]: ', required: false },
    { key: 'optional.sentryDsn', prompt: 'NEXT_PUBLIC_SENTRY_DSN [Optionnel]: ', required: false },
];

let currentQuestion = 0;

function askQuestion() {
    if (currentQuestion >= questions.length) {
        generateCommands();
        rl.close();
        return;
    }

    const q = questions[currentQuestion];
    rl.question(q.prompt, (answer) => {
        if (answer.trim()) {
            const keys = q.key.split('.');
            if (keys.length === 2) {
                config[keys[0]][keys[1]] = answer.trim();
            }
        }
        currentQuestion++;
        askQuestion();
    });
}

function generateCommands() {
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('\n📝 COMMANDES À EXÉCUTER DANS VERCEL\n');
    console.log('Copiez et exécutez ces commandes une par une:\n');

    const commands = [];

    // Admin variables
    if (config.admin.username) {
        commands.push(`vercel env add ADMIN_USERNAME production`);
        commands.push(`# Entrer: ${config.admin.username}\n`);
    }

    if (config.admin.passwordHash) {
        commands.push(`vercel env add ADMIN_PASSWORD_HASH production`);
        commands.push(`# Entrer: ${config.admin.passwordHash}\n`);
    }

    if (config.admin.salt) {
        commands.push(`vercel env add ADMIN_SALT production`);
        commands.push(`# Entrer: ${config.admin.salt}\n`);
    }

    if (config.admin.tokenSecret) {
        commands.push(`vercel env add ADMIN_TOKEN_SECRET production`);
        commands.push(`# Entrer: ${config.admin.tokenSecret}\n`);
    }

    // Supabase variables
    if (config.supabase.url) {
        commands.push(`vercel env add NEXT_PUBLIC_SUPABASE_URL production`);
        commands.push(`# Entrer: ${config.supabase.url}\n`);
    }

    if (config.supabase.anonKey) {
        commands.push(`vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production`);
        commands.push(`# Entrer: ${config.supabase.anonKey}\n`);
    }

    if (config.supabase.serviceKey) {
        commands.push(`vercel env add SUPABASE_SERVICE_ROLE_KEY production`);
        commands.push(`# Entrer: ${config.supabase.serviceKey}\n`);
    }

    // App variables
    if (config.app.url) {
        commands.push(`vercel env add NEXT_PUBLIC_APP_URL production`);
        commands.push(`# Entrer: ${config.app.url}\n`);
    }

    commands.push(`vercel env add NODE_ENV production`);
    commands.push(`# Entrer: production\n`);

    // Optional variables
    if (config.optional['2faEnabled'] === 'true') {
        commands.push(`vercel env add ADMIN_2FA_ENABLED production`);
        commands.push(`# Entrer: true\n`);

        if (config.optional['2faSecret']) {
            commands.push(`vercel env add ADMIN_2FA_SECRET production`);
            commands.push(`# Entrer: ${config.optional['2faSecret']}\n`);
        }
    }

    if (config.optional.upstashUrl) {
        commands.push(`vercel env add UPSTASH_REDIS_REST_URL production`);
        commands.push(`# Entrer: ${config.optional.upstashUrl}\n`);
    }

    if (config.optional.upstashToken) {
        commands.push(`vercel env add UPSTASH_REDIS_REST_TOKEN production`);
        commands.push(`# Entrer: ${config.optional.upstashToken}\n`);
    }

    if (config.optional.upstashUrl && config.optional.upstashToken) {
        commands.push(`vercel env add ENABLE_RATE_LIMITING production`);
        commands.push(`# Entrer: true\n`);
    }

    if (config.optional.sentryDsn) {
        commands.push(`vercel env add NEXT_PUBLIC_SENTRY_DSN production`);
        commands.push(`# Entrer: ${config.optional.sentryDsn}\n`);
    }

    // Print commands
    commands.forEach(cmd => console.log(cmd));

    console.log('════════════════════════════════════════════════════════════════');
    console.log('\n✅ PROCHAINES ÉTAPES:\n');
    console.log('1. Exécuter les commandes ci-dessus une par une');
    console.log('2. Vérifier: vercel env ls');
    console.log('3. Déployer: vercel --prod\n');

    // Save to file
    const fs = require('fs');
    const path = require('path');
    const commandsFile = path.join(__dirname, '..', 'vercel-config-commands.sh');

    let bashScript = '#!/bin/bash\n';
    bashScript += '# NUBIA AURA - Configuration Vercel Production\n';
    bashScript += '# Généré le: ' + new Date().toISOString() + '\n\n';
    bashScript += '# NOTE: Ce script est INTERACTIF\n';
    bashScript += '# Vercel va demander les valeurs pour chaque variable\n\n';

    // Filter only the vercel commands (not comments)
    const vercelCommands = commands.filter(cmd => cmd.startsWith('vercel'));
    bashScript += vercelCommands.join('\n');

    fs.writeFileSync(commandsFile, bashScript);

    console.log(`📁 Script sauvegardé: ${commandsFile}`);
    console.log('   (Vous pouvez l\'exécuter avec: bash vercel-config-commands.sh)\n');
}

// Start
console.log('════════════════════════════════════════════════════════════════\n');
console.log('Commençons la configuration...\n');
askQuestion();
