#!/usr/bin/env node
/**
 * Script de génération de secret 2FA - NUBIA AURA
 * Génère un secret TOTP pour l'authentification à deux facteurs
 */

const crypto = require('crypto');

console.log('\n🔐 NUBIA AURA - Générateur de Secret 2FA\n');
console.log('================================================\n');

// Générer un secret Base32 pour TOTP (compatible Google Authenticator)
function generateBase32Secret(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = crypto.randomBytes(length);
    let secret = '';

    for (let i = 0; i < length; i++) {
        secret += chars[bytes[i] % 32];
    }

    return secret;
}

// Générer des codes de récupération
function generateRecoveryCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
}

// Générer le secret 2FA
const secret = generateBase32Secret(20);
console.log('1. SECRET 2FA (TOTP - Base32):');
console.log(`   ${secret}\n`);

// Générer l'URL otpauth pour QR code
const issuer = 'NUBIA%20AURA';
const account = 'admin%40nubiaaura';
const otpauthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

console.log('2. URL OTPAUTH (pour générer QR code):');
console.log(`   ${otpauthUrl}\n`);

// Générer les codes de récupération
const recoveryCodes = generateRecoveryCodes(10);
console.log('3. CODES DE RÉCUPÉRATION (sauvegarder en lieu sûr):');
recoveryCodes.forEach((code, i) => {
    console.log(`   ${i + 1}. ${code}`);
});

console.log('\n================================================');
console.log('\n📝 CONFIGURATION:\n');
console.log('   Ajoutez ces lignes à votre .env.local:\n');
console.log(`   ADMIN_2FA_ENABLED=true`);
console.log(`   ADMIN_2FA_SECRET=${secret}`);

console.log('\n================================================');
console.log('\n📱 POUR SCANNER LE QR CODE:\n');
console.log('   1. Installez Google Authenticator ou Authy');
console.log('   2. Générez un QR code avec l\'URL ci-dessus:');
console.log('      https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(otpauthUrl));
console.log('   3. Scannez le QR code avec votre app');
console.log('   4. Vérifiez que le code à 6 chiffres fonctionne\n');

console.log('⚠️  IMPORTANT:');
console.log('   - Sauvegardez les codes de récupération hors-ligne');
console.log('   - Chaque code ne peut être utilisé qu\'une seule fois');
console.log('   - En cas de perte de téléphone, utilisez un code de récupération\n');
