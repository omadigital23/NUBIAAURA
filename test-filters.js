// Test des filtres avec les vraies catégories
async function testFilters() {
  const categories = [
    'chemises-wax',
    'costumes-africains',
    'robes-mariage',
    'robes-soiree',
    'robes-ville',
    'robes-wax',
    'super100',
  ];

  console.log('🧪 Test des filtres par catégorie\n');

  for (const category of categories) {
    try {
      const res = await fetch(`http://localhost:3001/api/products?category=${category}`);
      const data = await res.json();
      const count = data.data?.length || 0;
      
      const status = count > 0 ? '✅' : '❌';
      console.log(`${status} ${category.padEnd(25)} : ${count} produit(s)`);
      
      if (count > 0) {
        data.data.slice(0, 2).forEach(p => {
          console.log(`     - ${p.name}`);
        });
      }
    } catch (err) {
      console.error(`❌ ${category}: ${err.message}`);
    }
  }

  console.log('\n✅ Test terminé!');
}

testFilters();
