-- ============================================
-- NUBIA AURA - Row Level Security (RLS) Policies
-- Migration pour sécuriser toutes les tables
-- Date: 2026-01-04
-- ============================================

-- ============================================
-- 1. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLITIQUES POUR LA TABLE 'users'
-- ============================================

-- Les utilisateurs peuvent voir et modifier leurs propres données uniquement
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin peut tout voir/modifier (via service role key, pas RLS)

-- ============================================
-- 3. POLITIQUES POUR 'products' ET 'product_variants'
-- ============================================

-- Tout le monde peut voir les produits (lecture seule)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view product variants"
  ON product_variants FOR SELECT
  USING (true);

-- Seul le service role (admin) peut insérer/modifier/supprimer
-- Pas de politique = pas d'accès pour les utilisateurs authentifiés

-- ============================================
-- 4. POLITIQUES POUR 'categories'
-- ============================================

-- Lecture publique des catégories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- ============================================
-- 5. POLITIQUES POUR 'orders' ET 'order_items'
-- ============================================

-- Les utilisateurs peuvent voir uniquement leurs commandes
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    user_id IS NULL -- Commandes invités (vérifier via email dans l'app)
  );

-- Les utilisateurs peuvent créer des commandes
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL -- Permettre commandes invités
  );

-- Les utilisateurs peuvent voir les items de leurs commandes
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Insertion des order_items lors de la création de commande
CREATE POLICY "Users can insert order items for own orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- ============================================
-- 6. POLITIQUES POUR 'cart_items'
-- ============================================

-- Les utilisateurs gèrent uniquement leur panier
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (
    auth.uid() = user_id OR
    user_id IS NULL -- Panier invité (géré par session)
  );

CREATE POLICY "Users can insert into own cart"
  ON cart_items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL
  );

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  USING (
    auth.uid() = user_id OR
    user_id IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL
  );

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  USING (
    auth.uid() = user_id OR
    user_id IS NULL
  );

-- ============================================
-- 7. POLITIQUES POUR 'stock_reservations'
-- ============================================

-- Les utilisateurs peuvent voir leurs propres réservations
CREATE POLICY "Users can view own reservations"
  ON stock_reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = stock_reservations.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Seul le service role peut créer/modifier/supprimer les réservations
-- (Géré par l'API backend)

-- ============================================
-- 8. POLITIQUES POUR 'promo_codes'
-- ============================================

-- Les utilisateurs peuvent voir les codes promo actifs
CREATE POLICY "Users can view active promo codes"
  ON promo_codes FOR SELECT
  USING (
    active = true AND
    (valid_until IS NULL OR valid_until > NOW())
  );

-- Seul le service role peut créer/modifier les codes promo

-- ============================================
-- 9. POLITIQUES POUR 'reviews'
-- ============================================

-- Tout le monde peut voir les avis validés
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (status = 'approved');

-- Les utilisateurs peuvent créer des avis
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres avis
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres avis
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 10. POLITIQUES POUR 'custom_orders'
-- ============================================

-- Les utilisateurs peuvent voir leurs propres commandes personnalisées
CREATE POLICY "Users can view own custom orders"
  ON custom_orders FOR SELECT
  USING (
    auth.uid()::text = user_id OR
    user_id IS NULL
  );

-- Les utilisateurs peuvent créer des commandes personnalisées
CREATE POLICY "Users can create custom orders"
  ON custom_orders FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id OR
    user_id IS NULL
  );

-- ============================================
-- 11. POLITIQUES POUR 'contact_submissions'
-- ============================================

-- Les utilisateurs ne peuvent voir que leurs propres soumissions
CREATE POLICY "Users can view own contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Tout le monde peut créer une soumission de contact
CREATE POLICY "Anyone can create contact submission"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 12. VÉRIFICATION DES POLITIQUES
-- ============================================

-- Pour tester les politiques RLS, vous pouvez utiliser:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = 'user-uuid-here';
-- SELECT * FROM orders;
-- RESET ROLE;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

/*
1. Les politiques RLS s'appliquent uniquement aux connexions utilisant 
   la clé ANON ou les JWT utilisateurs.

2. La clé SERVICE_ROLE_KEY contourne TOUTES les politiques RLS.
   C'est pourquoi elle doit TOUJOURS rester côté serveur.

3. Pour les commandes invités (user_id IS NULL), l'application
   doit implémenter une vérification supplémentaire côté serveur
   (par exemple, vérifier l'email dans la session).

4. Les tables suivantes sont admin-only (pas de politique INSERT/UPDATE/DELETE):
   - products
   - product_variants
   - categories
   - stock_reservations
   - promo_codes (sauf SELECT)

5. Testez TOUJOURS les politiques avec un utilisateur réel avant
   de déployer en production.
*/
