# Instructions pour Exécuter les Migrations Manuellement

## ⚠️ Important

Si tu reçois l'erreur `ERROR: 42P01: relation "orders" does not exist`, cela signifie que la table `orders` n'existe pas dans ta base de données.

## 🚀 Étapes à suivre

### 1. Accéder à Supabase SQL Editor

1. Va sur https://app.supabase.com
2. Sélectionne ton projet
3. Clique sur **SQL Editor** dans la barre latérale gauche
4. Clique sur **New Query**

### 2. Exécuter la migration complète

Copie tout le contenu du fichier `migrations/create_orders_table_complete.sql` et colle-le dans l'éditeur SQL.

Ou exécute les requêtes une par une:

#### Étape 1: Créer les tables

```sql
-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  shipping_method TEXT,
  shipping_address JSONB,
  
  -- Delivery tracking columns
  delivery_duration_days INTEGER DEFAULT 3,
  shipped_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  carrier TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Étape 2: Créer les indexes

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status_date ON delivery_tracking(status_date DESC);
```

#### Étape 3: Activer RLS et créer les policies

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for delivery_tracking
CREATE POLICY "Users can view their order delivery tracking" ON delivery_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
```

#### Étape 4: Créer le trigger et les vues

```sql
-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at_trigger
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- Create views for analytics
CREATE OR REPLACE VIEW order_delivery_countdown AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.shipped_at,
  o.estimated_delivery_date,
  o.delivered_at,
  o.delivery_duration_days,
  CASE 
    WHEN o.status = 'delivered' THEN 0
    WHEN o.shipped_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (o.estimated_delivery_date - NOW()))::INTEGER
  END as days_remaining,
  CASE 
    WHEN o.status = 'delivered' THEN 'delivered'
    WHEN o.shipped_at IS NULL THEN 'pending'
    WHEN EXTRACT(DAY FROM (o.estimated_delivery_date - NOW())) <= 0 THEN 'overdue'
    ELSE 'in_transit'
  END as delivery_status
FROM orders o;

CREATE OR REPLACE VIEW return_eligibility AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.delivered_at,
  EXTRACT(HOUR FROM (NOW() - o.delivered_at))::INTEGER as hours_since_delivery,
  CASE 
    WHEN o.delivered_at IS NULL THEN false
    WHEN EXTRACT(HOUR FROM (NOW() - o.delivered_at)) < 72 THEN true
    ELSE false
  END as is_returnable,
  CASE 
    WHEN o.delivered_at IS NULL THEN NULL
    ELSE (o.delivered_at + INTERVAL '72 hours')
  END as return_deadline
FROM orders o
WHERE o.status = 'delivered';
```

### 3. Vérifier que tout fonctionne

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'delivery_tracking');

-- Vérifier les colonnes de orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Vérifier les vues
SELECT * FROM order_delivery_countdown LIMIT 1;
SELECT * FROM return_eligibility LIMIT 1;
```

### 4. Tester avec des données de test

```sql
-- Insérer une commande de test
INSERT INTO orders (user_id, order_number, total, status, payment_status, shipping_method, shipping_address, delivery_duration_days, shipped_at, estimated_delivery_date)
VALUES (
  'YOUR_USER_ID_HERE',
  'TEST-' || NOW()::text,
  50000,
  'shipped',
  'paid',
  'standard',
  '{"firstName": "Test", "lastName": "User", "address": "123 Main St", "city": "Dakar", "zipCode": "14000", "country": "Senegal"}',
  3,
  NOW(),
  NOW() + INTERVAL '3 days'
);

-- Vérifier le compte à rebours
SELECT * FROM order_delivery_countdown WHERE order_number LIKE 'TEST-%';
```

## 🆘 Troubleshooting

### Erreur: "relation already exists"
- Cela signifie que la table existe déjà
- Utilise `CREATE TABLE IF NOT EXISTS` (déjà fait dans les requêtes)

### Erreur: "permission denied"
- Vérifier que tu as les permissions d'admin sur Supabase
- Va dans **Settings** → **Database** → **Roles**

### Erreur: "foreign key violation"
- Vérifier que `auth.users` existe
- Vérifier que les IDs existent avant d'insérer

### Les vues ne s'affichent pas
- Vérifier que les tables existent d'abord
- Exécuter les créations de tables avant les vues

## ✅ Checklist

- [ ] Accéder à Supabase SQL Editor
- [ ] Exécuter les 4 étapes de migration
- [ ] Vérifier que les tables ont été créées
- [ ] Vérifier que les vues fonctionnent
- [ ] Tester avec des données de test
- [ ] Mettre à jour le code React si nécessaire
- [ ] Tester le build: `npm run build`

## 📝 Notes

- Les migrations utilisent `IF NOT EXISTS` pour éviter les erreurs si les tables existent déjà
- RLS (Row Level Security) est activé pour la sécurité
- Les indexes améliorent les performances des requêtes
- Les vues facilitent l'accès aux données pour le frontend
