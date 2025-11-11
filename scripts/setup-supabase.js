#!/usr/bin/env node

/**
 * Script de configuration Supabase pour Nubia Aura
 * Ce script :
 * 1. Vérifie la connexion à Supabase
 * 2. Crée les produits de test
 * 3. Corrige les API routes pour utiliser la DB réelle
 * 4. Met à jour la configuration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Données de test
const testProducts = [
  {
    slug: 'costume-blanc',
    name: 'White Costume',
    name_fr: 'Costume Blanc',
    name_en: 'White Costume',
    price: 50000,
    description: 'Elegant white costume perfect for special occasions',
    description_fr: 'Costume blanc élégant parfait pour les occasions spéciales',
    description_en: 'Elegant white costume perfect for special occasions',
    category: 'ready-to-wear',
    inStock: true,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White"],
    image: 'https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/costumes/africains/costume-blanc.jpg',
    rating: 4.5,
    reviews: 12
  },
  {
    slug: 'robe-mariage',
    name: 'Wedding Dress',
    name_fr: 'Robe de Mariage',
    name_en: 'Wedding Dress',
    price: 180000,
    description: 'Luxurious wedding dress with intricate details',
    description_fr: 'Robe de mariage luxueuse avec détails complexes',
    description_en: 'Luxurious wedding dress with intricate details',
    category: 'wedding',
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ivory", "White"],
    image: 'https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/wedding/dresses/luxury-wedding.jpg',
    rating: 4.8,
    reviews: 25
  },
  {
    slug: 'tenue-ville-chic',
    name: 'City Chic Outfit',
    name_fr: 'Tenue de Ville Chic',
    name_en: 'City Chic Outfit',
    price: 75000,
    description: 'Perfect urban style for modern women',
    description_fr: 'Style urbain parfait pour les femmes modernes',
    description_en: 'Perfect urban style for modern women',
    category: 'ready-to-wear',
    inStock: true,
    sizes: ["S", "M", "L"],
    colors: ["Black", "Navy", "Beige"],
    image: 'https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public/products/images/urban/chic-outfit.jpg',
    rating: 4.3,
    reviews: 18
  }
];

const testCategories = [
  { slug: 'ready-to-wear', name: 'Ready to Wear', name_fr: 'Prêt-à-porter', name_en: 'Ready to Wear' },
  { slug: 'wedding', name: 'Wedding', name_fr: 'Mariage', name_en: 'Wedding' },
  { slug: 'evening', name: 'Evening Wear', name_fr: 'Soirée', name_en: 'Evening Wear' }
];

async function checkConnection() {
  console.log('🔍 Vérification de la connexion Supabase...');
  
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return false;
    }
    
    console.log('✅ Connexion Supabase établie');
    return true;
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    return false;
  }
}

async function seedCategories() {
  console.log('🎯 Création des catégories...');
  
  for (const category of testCategories) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(category, { onConflict: 'slug' });
    
    if (error) {
      console.error(`❌ Erreur catégorie ${category.slug}:`, error.message);
    } else {
      console.log(`✅ Catégorie ${category.slug} créée/mise à jour`);
    }
  }
}

async function seedProducts() {
  console.log('🛍️ Création des produits...');
  
  for (const product of testProducts) {
    // Vérifier si le produit existe déjà
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', product.slug)
      .single();
    
    if (existing) {
      console.log(`ℹ️ Produit ${product.slug} existe déjà`);
      continue;
    }
    
    // Créer le produit
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (productError) {
      console.error(`❌ Erreur produit ${product.slug}:`, productError.message);
      continue;
    }
    
    console.log(`✅ Produit ${product.slug} créé`);
    
    // Créer les variants
    for (const size of product.sizes) {
      for (const color of product.colors) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productData.id,
            sku: `${product.slug}-${size}-${color.toLowerCase()}`,
            size: size,
            color: color,
            price: product.price,
            stock: Math.floor(Math.random() * 20) + 5 // Stock aléatoire 5-25
          });
        
        if (variantError) {
          console.error(`❌ Erreur variant ${product.slug}:`, variantError.message);
        }
      }
    }
    
    // Associer à la catégorie
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', product.category)
      .single();
    
    if (category) {
      await supabase
        .from('product_categories')
        .insert({
          product_id: productData.id,
          category_id: category.id
        });
    }
  }
}

async function verifySetup() {
  console.log('🔍 Vérification de la configuration...');
  
  // Vérifier les produits
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, product_variants(*)')
    .limit(5);
  
  if (productsError) {
    console.error('❌ Erreur vérification produits:', productsError.message);
  } else {
    console.log(`✅ ${products.length} produits trouvés`);
  }
  
  // Vérifier les catégories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*');
  
  if (categoriesError) {
    console.error('❌ Erreur vérification catégories:', categoriesError.message);
  } else {
    console.log(`✅ ${categories.length} catégories trouvées`);
  }
}

async function main() {
  console.log('🚀 Configuration Supabase pour Nubia Aura');
  console.log('='.repeat(50));
  
  // Vérifier la connexion
  const connected = await checkConnection();
  if (!connected) {
    console.error('❌ Arrêt du script - connexion impossible');
    process.exit(1);
  }
  
  // Créer les données
  await seedCategories();
  await seedProducts();
  await verifySetup();
  
  console.log('✅ Configuration terminée avec succès!');
  console.log('📋 Prochaines étapes:');
  console.log('   1. Vérifiez vos variables d\'environnement');
  console.log('   2. Testez l\'API /api/products');
  console.log('   3. Testez l\'API /api/checkout/quote');
  console.log('   4. Lancez npm run dev');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkConnection, seedProducts, seedCategories };
