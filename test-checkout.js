#!/usr/bin/env node

/**
 * Script de Test - Système de Checkout E-commerce
 * Teste les flux COD et Flutterwave
 * 
 * Usage: node test-checkout.js [--cod] [--flutterwave] [--all]
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_TIMEOUT: 30000,
  COLORS: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  },
};

// Données de test
const TEST_DATA = {
  cod: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+212612345678',
    address: '123 Rue de la Paix',
    city: 'Casablanca',
    zipCode: '20000',
    country: 'MA',
    shippingMethod: 'standard',
    items: [
      { product_id: '1', quantity: 2, price: 50000 },
      { product_id: '2', quantity: 1, price: 30000 },
    ],
  },
  flutterwave: {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@example.com',
    phone: '+212698765432',
    address: '456 Avenue Mohammed V',
    city: 'Rabat',
    zipCode: '10000',
    country: 'MA',
    shippingMethod: 'express',
    items: [
      { product_id: '3', quantity: 1, price: 100000 },
    ],
  },
};

// Utilitaires
const log = {
  info: (msg) => console.log(`${CONFIG.COLORS.blue}ℹ${CONFIG.COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${CONFIG.COLORS.green}✓${CONFIG.COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${CONFIG.COLORS.red}✗${CONFIG.COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${CONFIG.COLORS.yellow}⚠${CONFIG.COLORS.reset} ${msg}`),
  section: (title) => console.log(`\n${CONFIG.COLORS.cyan}${CONFIG.COLORS.bright}${title}${CONFIG.COLORS.reset}\n`),
  data: (data) => console.log(JSON.stringify(data, null, 2)),
};

/**
 * Effectue une requête HTTP/HTTPS
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new url.URL(path.startsWith('http') ? path : `${CONFIG.BASE_URL}${path}`);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    };

    const req = client.request(parsedUrl, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(CONFIG.API_TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${CONFIG.API_TIMEOUT}ms`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Teste le flux COD (Paiement à la Livraison)
 */
async function testCOD() {
  log.section('🧪 TEST 1: Flux COD (Paiement à la Livraison)');

  try {
    log.info('Préparation des données de test...');
    const payload = {
      shippingMethod: TEST_DATA.cod.shippingMethod,
      address: TEST_DATA.cod.address,
      city: TEST_DATA.cod.city,
      zipCode: TEST_DATA.cod.zipCode,
      country: TEST_DATA.cod.country,
      firstName: TEST_DATA.cod.firstName,
      lastName: TEST_DATA.cod.lastName,
      email: TEST_DATA.cod.email,
      phone: TEST_DATA.cod.phone,
      items: TEST_DATA.cod.items,
    };

    log.info(`Appel API: POST /api/orders/cod`);
    log.info(`Payload:`);
    log.data(payload);

    const response = await makeRequest('POST', '/api/orders/cod', payload);

    log.info(`Réponse: Status ${response.status}`);
    log.data(response.data);

    if (response.status === 201 || response.status === 200) {
      if (response.data.order?.id) {
        log.success(`Commande COD créée avec succès!`);
        log.success(`Order ID: ${response.data.order.id}`);
        log.success(`Order Number: ${response.data.order.order_number}`);
        log.success(`Status: ${response.data.order.status}`);
        log.success(`Payment Status: ${response.data.order.payment_status}`);
        return { success: true, orderId: response.data.order.id };
      } else {
        log.error(`Réponse OK mais pas d'order ID`);
        return { success: false };
      }
    } else {
      log.error(`Erreur: ${response.data.error || 'Erreur inconnue'}`);
      return { success: false };
    }
  } catch (error) {
    log.error(`Erreur lors du test COD: ${error.message}`);
    return { success: false };
  }
}

/**
 * Teste le flux Flutterwave (Paiement en Ligne)
 */
async function testFlutterwave() {
  log.section('🧪 TEST 2: Flux Flutterwave (Paiement en Ligne)');

  try {
    log.info('Préparation des données de test...');
    
    // Calculer le montant total
    const subtotal = TEST_DATA.flutterwave.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = TEST_DATA.flutterwave.shippingMethod === 'express' ? 15000 : 5000;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const payload = {
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: total,
      email: TEST_DATA.flutterwave.email,
      phone: TEST_DATA.flutterwave.phone,
      firstName: TEST_DATA.flutterwave.firstName,
      lastName: TEST_DATA.flutterwave.lastName,
      customerName: `${TEST_DATA.flutterwave.firstName} ${TEST_DATA.flutterwave.lastName}`,
      shippingMethod: TEST_DATA.flutterwave.shippingMethod,
      address: TEST_DATA.flutterwave.address,
      city: TEST_DATA.flutterwave.city,
      zipCode: TEST_DATA.flutterwave.zipCode,
      country: TEST_DATA.flutterwave.country,
      cartItems: TEST_DATA.flutterwave.items,
    };

    log.info(`Montant calculé: ${total} FCFA`);
    log.info(`  - Sous-total: ${subtotal} FCFA`);
    log.info(`  - Livraison: ${shipping} FCFA`);
    log.info(`  - Taxes: ${tax} FCFA`);

    log.info(`Appel API: POST /api/payments/initialize`);
    log.info(`Payload:`);
    log.data(payload);

    const response = await makeRequest('POST', '/api/payments/initialize', payload);

    log.info(`Réponse: Status ${response.status}`);
    log.data(response.data);

    if (response.status === 200) {
      if (response.data.paymentLink) {
        log.success(`Initialisation Flutterwave réussie!`);
        log.success(`Order ID: ${response.data.orderId}`);
        log.success(`Payment Link: ${response.data.paymentLink}`);
        log.success(`Reference: ${response.data.reference}`);
        log.warning(`Lien de paiement (à ouvrir dans un navigateur):`);
        console.log(`${CONFIG.COLORS.cyan}${response.data.paymentLink}${CONFIG.COLORS.reset}`);
        return { success: true, orderId: response.data.orderId, paymentLink: response.data.paymentLink };
      } else {
        log.error(`Réponse OK mais pas de lien de paiement`);
        return { success: false };
      }
    } else {
      log.error(`Erreur: ${response.data.error || 'Erreur inconnue'}`);
      return { success: false };
    }
  } catch (error) {
    log.error(`Erreur lors du test Flutterwave: ${error.message}`);
    return { success: false };
  }
}

/**
 * Teste la récupération d'une commande
 */
async function testGetOrder(orderId) {
  log.section('🧪 TEST 3: Récupération d\'une Commande');

  try {
    log.info(`Récupération de la commande: ${orderId}`);
    const response = await makeRequest('GET', `/api/orders/${orderId}`);

    log.info(`Réponse: Status ${response.status}`);
    log.data(response.data);

    if (response.status === 200 && response.data.order) {
      log.success(`Commande récupérée avec succès!`);
      log.success(`Numéro: ${response.data.order.order_number}`);
      log.success(`Statut: ${response.data.order.status}`);
      return { success: true };
    } else {
      log.error(`Erreur: ${response.data.error || 'Erreur inconnue'}`);
      return { success: false };
    }
  } catch (error) {
    log.error(`Erreur lors de la récupération: ${error.message}`);
    return { success: false };
  }
}

/**
 * Affiche un résumé des tests
 */
function printSummary(results) {
  log.section('📊 RÉSUMÉ DES TESTS');

  const tests = [
    { name: 'COD', result: results.cod },
    { name: 'Flutterwave', result: results.flutterwave },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    if (test.result?.success) {
      log.success(`${test.name}: RÉUSSI`);
      passed++;
    } else {
      log.error(`${test.name}: ÉCHOUÉ`);
      failed++;
    }
  });

  log.section('📈 STATISTIQUES');
  log.success(`Tests réussis: ${passed}`);
  log.error(`Tests échoués: ${failed}`);
  log.info(`Total: ${passed + failed}`);

  if (failed === 0) {
    log.success(`\n✨ Tous les tests sont passés avec succès!`);
  } else {
    log.warning(`\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`\n${CONFIG.COLORS.bright}${CONFIG.COLORS.cyan}🚀 Test du Système de Checkout E-commerce${CONFIG.COLORS.reset}\n`);
  log.info(`Base URL: ${CONFIG.BASE_URL}`);
  log.info(`Timeout: ${CONFIG.API_TIMEOUT}ms\n`);

  const args = process.argv.slice(2);
  const runCOD = args.includes('--cod') || args.includes('--all') || args.length === 0;
  const runFlutterwave = args.includes('--flutterwave') || args.includes('--all') || args.length === 0;

  const results = {
    cod: null,
    flutterwave: null,
  };

  if (runCOD) {
    results.cod = await testCOD();
  }

  if (runFlutterwave) {
    results.flutterwave = await testFlutterwave();
  }

  printSummary(results);

  // Afficher les prochaines étapes
  log.section('📋 PROCHAINES ÉTAPES');
  log.info('1. Vérifier les logs de la console du serveur');
  log.info('2. Vérifier les données dans Supabase');
  log.info('3. Tester les flux dans le navigateur');
  log.info('4. Implémenter l\'envoi WhatsApp');
  log.info('5. Créer la page de confirmation\n');

  process.exit(results.cod?.success || results.flutterwave?.success ? 0 : 1);
}

// Lancer le script
main().catch((error) => {
  log.error(`Erreur fatale: ${error.message}`);
  process.exit(1);
});
