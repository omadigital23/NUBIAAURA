#!/usr/bin/env node

/**
 * Script de test du checkout flow
 * Vérifie toutes les conditions pour activer le bouton
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://exjtjbciznzyyqrfctsc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

console.log('🔍 TEST DU CHECKOUT FLOW - Nubia Aura');
console.log('='.repeat(60));

async function testCheckoutFlow() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Test 1: Vérifier les produits
  console.log('\n📦 Test 1: Vérification des produits...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, name_fr, price, "inStock"')
    .limit(3);
  
  if (productsError) {
    console.error('❌ Erreur produits:', productsError.message);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('⚠️ Aucun produit trouvé dans la base');
    return;
  }
  
  console.log(`✅ ${products.length} produits trouvés`);
  products.forEach(p => {
    console.log(`   - ${p.name_fr || p.name} (${p.id}) - ${p.price} FCFA`);
  });
  
  // Test 2: Tester l'API quote avec un produit réel
  console.log('\n💰 Test 2: Test de l\'API checkout/quote...');
  const testProduct = products[0];
  const quoteData = {
    locale: 'fr',
    shippingMethod: 'standard',
    items: [{ product_id: testProduct.id, quantity: 1 }]
  };
  
  console.log('📋 Données envoyées:', JSON.stringify(quoteData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ API quote fonctionne!');
      console.log('💵 Quote calculé:', JSON.stringify(data.quote, null, 2));
    } else {
      console.log('❌ API quote échoue:', data.error || 'Erreur inconnue');
      if (data.details) console.log('   Détails:', data.details);
    }
  } catch (err) {
    console.log('❌ Erreur réseau:', err.message);
    console.log('💡 Assurez-vous que le serveur tourne: npm run dev');
  }
  
  // Test 3: Conditions du bouton
  console.log('\n🔘 Test 3: Conditions du bouton "Passer ma commande"');
  console.log('Le bouton est désactivé si:');
  console.log('   1. loading === true (en cours de traitement)');
  console.log('   2. quoteLoading === true (calcul du quote en cours)');
  console.log('   3. cartItems.length === 0 (panier vide)');
  console.log('   4. paymentMethod === "" (aucune méthode sélectionnée)');
  
  console.log('\n✅ Pour activer le bouton:');
  console.log('   1. ✓ Ajouter des produits au panier');
  console.log('   2. ✓ Remplir le formulaire d\'adresse (étape 1)');
  console.log('   3. ✓ Choisir la méthode de livraison (étape 2)');
  console.log('   4. ✓ Sélectionner un mode de paiement (étape 3)');
  console.log('   5. ✓ Attendre que l\'API quote termine');
  
  // Test 4: Vérifier les variants
  console.log('\n🎨 Test 4: Vérification des variants...');
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, product_id, size, color, stock, price')
    .limit(5);
  
  if (variantsError) {
    console.log('⚠️ Pas de variants trouvés');
  } else if (variants && variants.length > 0) {
    console.log(`✅ ${variants.length} variants trouvés`);
    variants.forEach(v => {
      console.log(`   - ${v.size || 'N/A'} / ${v.color || 'N/A'} - Stock: ${v.stock}`);
    });
  } else {
    console.log('⚠️ Aucun variant trouvé');
  }
}

// Test 5: Instructions de débogage
function showDebugInstructions() {
  console.log('\n🔧 INSTRUCTIONS DE DÉBOGAGE');
  console.log('='.repeat(60));
  console.log('\n1. Ouvrir la console du navigateur (F12)');
  console.log('2. Aller sur la page checkout');
  console.log('3. Vérifier ces valeurs dans la console:');
  console.log('');
  console.log('   - cartItems.length > 0 ?');
  console.log('   - quoteLoading === false ?');
  console.log('   - quote !== null ?');
  console.log('   - paymentMethod !== "" ?');
  console.log('');
  console.log('4. Si quoteLoading est bloqué à true:');
  console.log('   - Vérifier les logs "[Quote API]" dans la console');
  console.log('   - Vérifier la réponse de /api/checkout/quote dans Network tab');
  console.log('');
  console.log('5. Si paymentMethod est vide:');
  console.log('   - Cliquer sur un mode de paiement (Flutterwave ou COD)');
  console.log('   - Vérifier que le state est mis à jour');
  console.log('');
}

// Exécution
testCheckoutFlow()
  .then(() => {
    showDebugInstructions();
    console.log('\n✅ Test terminé!');
  })
  .catch(err => {
    console.error('\n❌ Erreur:', err.message);
    process.exit(1);
  });
