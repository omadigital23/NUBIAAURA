// Test de l'authentification admin
async function testAdminAuth() {
  console.log('🧪 Test de l\'authentification admin\n');

  const baseUrl = 'http://localhost:3001';
  const username = 'Nubia_dca740c1';
  const password = 'Nubia_0b2b065744aa1557_2024!';

  try {
    // Test 1: Connexion réussie
    console.log('1️⃣  Test de connexion réussie...');
    const res1 = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data1 = await res1.json();
    
    if (res1.ok && data1.success) {
      console.log('✅ Connexion réussie!');
      console.log(`   Token: ${data1.token.substring(0, 20)}...`);
      console.log(`   Username: ${data1.username}\n`);
    } else {
      console.log('❌ Connexion échouée');
      console.log(`   Status: ${res1.status}`);
      console.log(`   Error: ${data1.error}\n`);
    }

    // Test 2: Mauvais mot de passe
    console.log('2️⃣  Test avec mauvais mot de passe...');
    const res2 = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'wrong_password' }),
    });

    const data2 = await res2.json();
    
    if (res2.status === 401) {
      console.log('✅ Rejeté correctement (401 Unauthorized)');
      console.log(`   Error: ${data2.error}\n`);
    } else {
      console.log('❌ Devrait être rejeté!\n');
    }

    // Test 3: Mauvais username
    console.log('3️⃣  Test avec mauvais username...');
    const res3 = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrong_user', password }),
    });

    const data3 = await res3.json();
    
    if (res3.status === 401) {
      console.log('✅ Rejeté correctement (401 Unauthorized)');
      console.log(`   Error: ${data3.error}\n`);
    } else {
      console.log('❌ Devrait être rejeté!\n');
    }

    // Test 4: Données manquantes
    console.log('4️⃣  Test avec données manquantes...');
    const res4 = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    const data4 = await res4.json();
    
    if (res4.status === 400) {
      console.log('✅ Rejeté correctement (400 Bad Request)');
      console.log(`   Error: ${data4.error}\n`);
    } else {
      console.log('❌ Devrait être rejeté!\n');
    }

    console.log('✅ Tous les tests sont terminés!');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

testAdminAuth();
