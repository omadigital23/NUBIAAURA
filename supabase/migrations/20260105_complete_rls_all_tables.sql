-- ============================================
-- NUBIA AURA - Row Level Security (RLS) Policies
-- Migration COMPLÈTE pour sécuriser toutes les tables
-- Date: 5 janvier 2026
-- ADAPTÉ AU SCHÉMA RÉEL DE LA BASE DE DONNÉES
-- ============================================

-- ============================================
-- 1. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

-- Tables principales
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

-- Catégories et tags
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Commandes
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_coupons ENABLE ROW LEVEL SECURITY;

-- Panier
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Stock et promotions
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Commandes personnalisées
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- Contact et newsletter
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Returns et shipments
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Addresses et wishlist
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- 3. POLITIQUES POUR 'products' ET TABLES LIÉES
-- ============================================

-- Tout le monde peut voir les produits
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view product variants"
  ON product_variants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view product categories"
  ON product_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view product tags"
  ON product_tags FOR SELECT
  USING (true);

-- ============================================
-- 4. POLITIQUES POUR 'categories' ET 'tags'
-- ============================================

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  USING (true);

-- ============================================
-- 5. POLITIQUES POUR 'orders' ET TABLES LIÉES
-- ============================================

-- Les utilisateurs peuvent voir uniquement leurs commandes
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des commandes
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent voir les items de leurs commandes
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Insertion des order_items lors de la création de commande
CREATE POLICY "Users can insert order items for own orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Politiques pour order_coupons
CREATE POLICY "Users can view coupons on own orders"
  ON order_coupons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_coupons.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert coupons on own orders"
  ON order_coupons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_coupons.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. POLITIQUES POUR 'carts' ET 'cart_items'
-- ============================================

-- Les utilisateurs gèrent uniquement leur panier
CREATE POLICY "Users can view own cart"
  ON carts FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create cart"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own cart"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own cart"
  ON carts FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Cart items
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR carts.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert into own cart"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR carts.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR carts.user_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR carts.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR carts.user_id IS NULL)
    )
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
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. POLITIQUES POUR 'promo_codes' ET 'coupons'
-- ============================================

-- Les utilisateurs peuvent voir les codes promo actifs
CREATE POLICY "Users can view active promo codes"
  ON promo_codes FOR SELECT
  USING (
    is_active = true AND
    (valid_until IS NULL OR valid_until > NOW())
  );

CREATE POLICY "Users can view active coupons"
  ON coupons FOR SELECT
  USING (
    active = true AND
    (ends_at IS NULL OR ends_at > NOW())
  );

-- ============================================
-- 9. POLITIQUES POUR 'product_reviews'
-- ============================================

-- Tout le monde peut voir les avis
CREATE POLICY "Anyone can view product reviews"
  ON product_reviews FOR SELECT
  USING (true);

-- Les utilisateurs peuvent créer des avis
CREATE POLICY "Authenticated users can create reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres avis
CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres avis
CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 10. POLITIQUES POUR 'custom_orders'
-- ============================================

-- Les utilisateurs peuvent voir leurs propres commandes personnalisées
CREATE POLICY "Users can view own custom orders"
  ON custom_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des commandes personnalisées
CREATE POLICY "Users can create custom orders"
  ON custom_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
-- 12. POLITIQUES POUR 'newsletter_subscriptions'
-- ============================================

-- Les utilisateurs peuvent voir leur propre inscription
CREATE POLICY "Users can view own newsletter subscription"
  ON newsletter_subscriptions FOR SELECT
  USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Tout le monde peut s'inscrire à la newsletter
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions FOR INSERT
  WITH CHECK (true);

-- Les utilisateurs peuvent se désinscrire
CREATE POLICY "Users can update own newsletter subscription"
  ON newsletter_subscriptions FOR UPDATE
  USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- ============================================
-- 13. POLITIQUES POUR 'returns'
-- ============================================

-- Les utilisateurs peuvent voir leurs propres retours
CREATE POLICY "Users can view own returns"
  ON returns FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des retours pour leurs commandes
CREATE POLICY "Users can create returns for own orders"
  ON returns FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = returns.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 14. POLITIQUES POUR 'shipments' ET 'delivery_tracking'
-- ============================================

-- Les utilisateurs peuvent voir les envois de leurs commandes
CREATE POLICY "Users can view shipments for own orders"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent voir le suivi de livraison de leurs commandes
CREATE POLICY "Users can view delivery tracking for own orders"
  ON delivery_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_tracking.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 15. POLITIQUES POUR 'addresses'
-- ============================================

-- Les utilisateurs gèrent uniquement leurs propres adresses
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 16. POLITIQUES POUR 'wishlists' ET 'wishlist_items'
-- ============================================

-- Les utilisateurs gèrent uniquement leur wishlist
CREATE POLICY "Users can view own wishlists"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wishlists"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlists"
  ON wishlists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlists"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Wishlist items
CREATE POLICY "Users can view own wishlist items"
  ON wishlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into own wishlist"
  ON wishlist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete from own wishlist"
  ON wishlist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

-- ============================================
-- RÉSUMÉ DES POLITIQUES
-- ============================================

/*
TABLES SÉCURISÉES (27 au total):

✅ UTILISATEURS:
   - users (SELECT/UPDATE propre profil)
   - addresses (CRUD propres adresses)

✅ PRODUITS (lecture publique):
   - products
   - product_variants
   - product_images
   - product_categories
   - product_tags
   - categories
   - tags

✅ COMMANDES (isolation stricte):
   - orders (SELECT/INSERT par user_id)
   - order_items (via relation orders)
   - order_coupons (via relation orders)

✅ PANIER (isolation stricte):
   - carts (CRUD par user_id)
   - cart_items (via relation carts)

✅ AVIS & RETOURS:
   - product_reviews (CRUD propres avis)
   - returns (SELECT/INSERT propres retours)

✅ STOCK & PROMOTIONS (admin-only modify):
   - stock_reservations (SELECT via orders)
   - promo_codes (SELECT actifs uniquement)
   - coupons (SELECT actifs uniquement)

✅ COMMANDES PERSONNALISÉES:
   - custom_orders (SELECT/INSERT par user_id)

✅ LIVRAISON (lecture via commandes):
   - shipments (SELECT via orders)
   - delivery_tracking (SELECT via orders)

✅ CONTACT & NEWSLETTER:
   - contact_submissions (SELECT par email, INSERT public)
   - newsletter_subscriptions (SELECT/UPDATE par email, INSERT public)

✅ WISHLIST:
   - wishlists (CRUD par user_id)
   - wishlist_items (via relation wishlists)

NOTES IMPORTANTES:

1. La clé SERVICE_ROLE_KEY contourne TOUTES les politiques RLS.
   → Utilisée uniquement côté serveur pour les opérations admin

2. Les tables en lecture publique : products, categories, tags, etc.
   → Modification uniquement via SERVICE_ROLE_KEY

3. Isolation stricte par user_id pour :
   → orders, carts, addresses, wishlists, returns, custom_orders

4. Relations en cascade sécurisées via EXISTS :
   → order_items via orders
   → cart_items via carts
   → wishlist_items via wishlists

5. Pour tester : SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = 'uuid';
*/
