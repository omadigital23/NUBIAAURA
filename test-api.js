// Test API pour déboguer les catégories et produits
async function testAPI() {
  console.log('=== TEST API CATEGORIES ===');
  try {
    const catRes = await fetch('http://localhost:3001/api/categories');
    const catData = await catRes.json();
    console.log('Categories:', JSON.stringify(catData, null, 2));
  } catch (err) {
    console.error('Error fetching categories:', err);
  }

  console.log('\n=== TEST API PRODUCTS (ALL) ===');
  try {
    const prodRes = await fetch('http://localhost:3001/api/products');
    const prodData = await prodRes.json();
    console.log('Products count:', prodData.data?.length);
    console.log('First product:', JSON.stringify(prodData.data?.[0], null, 2));
  } catch (err) {
    console.error('Error fetching products:', err);
  }

  console.log('\n=== TEST API PRODUCTS (FILTER: ready-to-wear) ===');
  try {
    const filterRes = await fetch('http://localhost:3001/api/products?category=ready-to-wear');
    const filterData = await filterRes.json();
    console.log('Products with category=ready-to-wear:', filterData.data?.length);
    console.log('Data:', JSON.stringify(filterData, null, 2));
  } catch (err) {
    console.error('Error fetching filtered products:', err);
  }

  console.log('\n=== TEST API PRODUCTS (FILTER: custom) ===');
  try {
    const filterRes = await fetch('http://localhost:3001/api/products?category=custom');
    const filterData = await filterRes.json();
    console.log('Products with category=custom:', filterData.data?.length);
    console.log('Data:', JSON.stringify(filterData, null, 2));
  } catch (err) {
    console.error('Error fetching filtered products:', err);
  }
}

testAPI();
