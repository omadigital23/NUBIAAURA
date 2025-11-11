#!/usr/bin/env node

/**
 * DIAGNOSTIC COMPLET DU CHECKOUT FLOW
 * Identifie TOUS les problèmes qui empêchent le bouton de s'activer
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://exjtjbciznzyyqrfctsc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4anRqYmNpem56eXlxcmZjdHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ0NSwiZXhwIjoyMDc3NzY0NDQ1fQ.1BSRCFwYaz_Q3K-xiwrSXOahwZKxUwMxFR3EaRaBf9s';

console.log('🔍 DIAGNOSTIC COMPLET DU CHECKOUT FLOW');
console.log('='.repeat(70));

async function diagnose() {
  const issues = [];
  const fixes = [];
  
  // 1. Vérifier la connexion Supabase
  console.log('\n📡 1. Test de connexion Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    if (error) {
      issues.push('❌ Connexion Supabase échoue: ' + error.message);
      fixes.push('Vérifier NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local');
    } else {
      console.log('✅ Connexion Supabase OK');
    }
  } catch (err) {
    issues.push('❌ Erreur Supabase: ' + err.message);
  }
  
  // 2. Vérifier les produits
  console.log('\n📦 2. Vérification des produits...');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, name_fr, price, "inStock"')
    .eq('inStock', true)
    .limit(5);
  
  if (prodError) {
    issues.push('❌ Impossible de récupérer les produits: ' + prodError.message);
  } else if (!products || products.length === 0) {
    issues.push('❌ Aucun produit en stock dans la base');
    fixes.push('Ajouter des produits avec inStock=true dans Supabase');
  } else {
    console.log(`✅ ${products.length} produits en stock trouvés`);
    products.forEach(p => {
      console.log(`   - ${p.name_fr || p.name} (${p.id.substring(0, 8)}...) - ${p.price} FCFA`);
    });
  }
  
  // 3. Tester l'API quote
  console.log('\n💰 3. Test de l\'API /api/checkout/quote...');
  
  if (products && products.length > 0) {
    const testProduct = products[0];
    const quotePayload = {
      locale: 'fr',
      shippingMethod: 'standard',
      items: [{ product_id: testProduct.id, quantity: 1 }]
    };
    
    try {
      const response = await fetch('http://localhost:3000/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ API quote fonctionne!');
        console.log('   Quote:', JSON.stringify(data.quote, null, 2));
      } else {
        issues.push(`❌ API quote échoue: ${data.error || 'Unknown error'}`);
        if (data.details) {
          console.log('   Détails:', data.details);
        }
        fixes.push('Vérifier les logs du serveur Next.js');
      }
    } catch (err) {
      issues.push('❌ Impossible de contacter l\'API: ' + err.message);
      fixes.push('Démarrer le serveur: npm run dev');
    }
  }
  
  // 4. Vérifier le fichier checkout/page.tsx
  console.log('\n📄 4. Analyse du fichier checkout/page.tsx...');
  const checkoutPath = path.join(__dirname, '..', 'app', 'checkout', 'page.tsx');
  
  if (fs.existsSync(checkoutPath)) {
    const content = fs.readFileSync(checkoutPath, 'utf8');
    
    // Vérifier la condition du bouton
    const disabledMatch = content.match(/disabled=\{([^}]+)\}/);
    if (disabledMatch) {
      console.log('✅ Condition du bouton trouvée:');
      console.log(`   ${disabledMatch[1]}`);
      
      // Analyser chaque condition
      const conditions = disabledMatch[1].split('||').map(c => c.trim());
      console.log('\n   Conditions qui désactivent le bouton:');
      conditions.forEach((cond, i) => {
        console.log(`   ${i + 1}. ${cond}`);
      });
    }
    
    // Vérifier useEffect pour quote
    if (content.includes('useEffect') && content.includes('quote')) {
      console.log('✅ useEffect pour le quote trouvé');
    } else {
      issues.push('❌ useEffect pour le quote manquant ou mal configuré');
    }
    
    // Vérifier la gestion de paymentMethod
    if (content.includes('setPaymentMethod')) {
      console.log('✅ Gestion de paymentMethod présente');
    } else {
      issues.push('❌ setPaymentMethod manquant');
    }
  } else {
    issues.push('❌ Fichier checkout/page.tsx introuvable');
  }
  
  // 5. Vérifier les hooks
  console.log('\n🎣 5. Vérification des hooks...');
  const hooksToCheck = [
    'hooks/useCart.ts',
    'hooks/useAuth.ts',
    'contexts/CartContext.tsx'
  ];
  
  hooksToCheck.forEach(hookPath => {
    const fullPath = path.join(__dirname, '..', hookPath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${hookPath} existe`);
    } else {
      issues.push(`❌ ${hookPath} manquant`);
    }
  });
  
  // 6. Résumé et solutions
  console.log('\n' + '='.repeat(70));
  console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
  console.log('='.repeat(70));
  
  if (issues.length === 0) {
    console.log('\n✅ AUCUN PROBLÈME DÉTECTÉ!');
    console.log('\n🔍 Le bouton devrait être actif si:');
    console.log('   1. Vous avez des produits dans le panier');
    console.log('   2. Vous avez rempli le formulaire d\'adresse');
    console.log('   3. Vous avez sélectionné un mode de paiement (COD ou Flutterwave)');
    console.log('   4. L\'API quote a terminé de charger');
    
    console.log('\n🧪 TEST MANUEL:');
    console.log('   1. Ouvrir http://localhost:3000');
    console.log('   2. Ajouter un produit au panier');
    console.log('   3. Aller au checkout');
    console.log('   4. Remplir le formulaire (étapes 1 et 2)');
    console.log('   5. À l\'étape 3, CLIQUER sur "Paiement à la livraison"');
    console.log('   6. Le bouton devrait s\'activer immédiatement');
    
    console.log('\n🔧 SI LE BOUTON RESTE INACTIF:');
    console.log('   Ouvrir la console (F12) et taper:');
    console.log('   ```');
    console.log('   console.log({');
    console.log('     cartItems: cartItems.length,');
    console.log('     quoteLoading,');
    console.log('     quote,');
    console.log('     paymentMethod,');
    console.log('     loading');
    console.log('   });');
    console.log('   ```');
  } else {
    console.log(`\n❌ ${issues.length} PROBLÈME(S) DÉTECTÉ(S):\n`);
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    
    if (fixes.length > 0) {
      console.log(`\n🔧 SOLUTIONS PROPOSÉES:\n`);
      fixes.forEach((fix, i) => {
        console.log(`${i + 1}. ${fix}`);
      });
    }
  }
  
  // 7. Créer un fichier de rapport
  const report = {
    timestamp: new Date().toISOString(),
    issues,
    fixes,
    productsCount: products?.length || 0,
    apiWorking: issues.filter(i => i.includes('API quote')).length === 0
  };
  
  const reportPath = path.join(__dirname, '..', 'checkout-diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
}

diagnose().catch(err => {
  console.error('\n❌ ERREUR FATALE:', err.message);
  process.exit(1);
});
