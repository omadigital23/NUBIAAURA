-- Script SQL pour créer les produits de test
-- À exécuter dans Supabase SQL Editor

-- 1. Créer les produits de test
INSERT INTO products (
  id,
  name,
  description,
  price,
  category,
  "inStock",
  created_at,
  updated_at
) VALUES
  (
    '1',
    'Produit Test 1 - Vêtement',
    'Produit de test pour le système de checkout - Article 1',
    50000,
    'vetements',
    true,
    NOW(),
    NOW()
  ),
  (
    '2',
    'Produit Test 2 - Accessoire',
    'Produit de test pour le système de checkout - Article 2',
    30000,
    'accessoires',
    true,
    NOW(),
    NOW()
  ),
  (
    '3',
    'Produit Test 3 - Premium',
    'Produit de test pour le système de checkout - Article Premium',
    100000,
    'premium',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 2. Vérifier que les produits sont créés
SELECT id, name, price, "inStock", category FROM products WHERE id IN ('1', '2', '3');

-- 3. Créer les variantes de produits (si la table existe)
-- Cela permet au système de vérifier le stock correctement
INSERT INTO product_variants (
  product_id,
  name,
  stock,
  created_at,
  updated_at
) VALUES
  ('1', 'Taille M', 100, NOW(), NOW()),
  ('1', 'Taille L', 100, NOW(), NOW()),
  ('2', 'Couleur Noir', 50, NOW(), NOW()),
  ('2', 'Couleur Blanc', 50, NOW(), NOW()),
  ('3', 'Standard', 200, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. Vérifier les variantes
SELECT product_id, name, stock FROM product_variants WHERE product_id IN ('1', '2', '3');

-- 5. Résumé
SELECT 
  COUNT(*) as total_produits,
  SUM(CASE WHEN "inStock" = true THEN 1 ELSE 0 END) as produits_en_stock
FROM products WHERE id IN ('1', '2', '3');
