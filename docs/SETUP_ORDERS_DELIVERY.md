# Configuration du Système de Commandes et Suivi de Livraison

## 📊 Analyse de ta base de données

J'ai analysé ta structure Supabase. Voici ce que j'ai trouvé:

### ✅ Tables existantes:
- `order_items` - Articles des commandes (EXISTS)
- `users` - Profil utilisateur (EXISTS)
- `auth.users` - Authentification Supabase (EXISTS)
- `tracking_events` - Événements de tracking (EXISTS)

### ❌ Tables manquantes:
- `orders` - Table principale des commandes (MISSING)
- `delivery_tracking` - Historique de suivi (MISSING)

## 🚀 Installation

### Étape 1: Exécuter la migration SQL

Va sur https://app.supabase.com → Ton projet → **SQL Editor** → **New Query**

Copie et exécute le contenu du fichier:
**`migrations/create_orders_table_adapted.sql`**

Ou exécute manuellement:

```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number text NOT NULL UNIQUE,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])),
  payment_status text NOT NULL DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text])),
  shipping_method text,
  shipping_address jsonb,
  
  -- Delivery tracking columns
  delivery_duration_days integer NOT NULL DEFAULT 3,
  shipped_at timestamp with time zone,
  estimated_delivery_date timestamp with time zone,
  delivered_at timestamp with time zone,
  tracking_number text,
  carrier text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Update order_items to reference orders table
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  status_date timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT delivery_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON public.orders(shipped_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON public.orders(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON public.orders(delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON public.order_items(service_id);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON public.delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status_date ON public.delivery_tracking(status_date DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their order delivery tracking" ON public.delivery_tracking;
CREATE POLICY "Users can view their order delivery tracking" ON public.delivery_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Create trigger
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON public.orders;
CREATE TRIGGER update_orders_updated_at_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_updated_at();

-- Create views
DROP VIEW IF EXISTS public.order_delivery_countdown CASCADE;
CREATE VIEW public.order_delivery_countdown AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
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
    WHEN o.status = 'delivered' THEN 'delivered'::text
    WHEN o.shipped_at IS NULL THEN 'pending'::text
    WHEN EXTRACT(DAY FROM (o.estimated_delivery_date - NOW())) <= 0 THEN 'overdue'::text
    ELSE 'in_transit'::text
  END as delivery_status
FROM public.orders o;

DROP VIEW IF EXISTS public.return_eligibility CASCADE;
CREATE VIEW public.return_eligibility AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.user_id,
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
FROM public.orders o
WHERE o.status = 'delivered'::text;
```

### Étape 2: Vérifier que tout fonctionne

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'delivery_tracking')
ORDER BY table_name;

-- Vérifier les colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Vérifier les vues
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('order_delivery_countdown', 'return_eligibility');
```

### Étape 3: Tester avec des données

```sql
-- Insérer une commande de test
INSERT INTO public.orders (
  user_id, 
  order_number, 
  total, 
  status, 
  payment_status, 
  shipping_method, 
  shipping_address,
  delivery_duration_days,
  shipped_at,
  estimated_delivery_date
)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
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

## 📁 Fichiers créés

### Backend APIs
1. `app/api/admin/orders/[id]/delivery/route.ts`
   - PUT: Mettre à jour la livraison
   - GET: Récupérer les infos de livraison

2. `app/api/returns/eligibility/route.ts`
   - GET: Vérifier l'éligibilité des retours (72h)

### Frontend Hooks
3. `hooks/useDeliveryCountdown.ts`
   - Compte à rebours en temps réel
   - Calcul des jours, heures, minutes, secondes

4. `hooks/useReturnEligibility.ts`
   - Vérification de l'éligibilité des retours

### Frontend Components
5. `components/DeliveryCountdown.tsx`
   - Affichage du compte à rebours
   - Barre de progression
   - Couleurs selon le statut

6. `components/ReturnEligibilityBanner.tsx`
   - Affichage de l'éligibilité des retours
   - Bouton "Demander un retour"

## 🎯 Utilisation

### Afficher le compte à rebours dans une page

```tsx
import DeliveryCountdown from '@/components/DeliveryCountdown';

export default function OrderDetail({ order }) {
  return (
    <DeliveryCountdown
      estimatedDeliveryDate={order.estimated_delivery_date}
      deliveryDurationDays={order.delivery_duration_days}
      isDelivered={order.status === 'delivered'}
      shippedAt={order.shipped_at}
    />
  );
}
```

### Afficher l'éligibilité des retours

```tsx
import ReturnEligibilityBanner from '@/components/ReturnEligibilityBanner';

export default function OrderDetail({ order }) {
  return (
    <ReturnEligibilityBanner
      orderId={order.id}
      onReturnClick={() => {
        // Ouvrir le formulaire de retour
      }}
    />
  );
}
```

## 🔧 API Admin - Mettre à jour la livraison

```bash
curl -X PUT http://localhost:3000/api/admin/orders/[ORDER_ID]/delivery \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=YOUR_TOKEN" \
  -d '{
    "delivery_duration_days": 3,
    "shipped_at": "2024-11-15T10:00:00Z",
    "tracking_number": "TRACK123456",
    "carrier": "DHL",
    "status": "shipped"
  }'
```

## 📊 Colonnes de la table `orders`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence à l'utilisateur |
| `order_number` | TEXT | Numéro de commande unique |
| `total` | NUMERIC | Montant total |
| `status` | TEXT | État (pending, processing, shipped, delivered, cancelled) |
| `payment_status` | TEXT | État du paiement (pending, paid, failed, refunded) |
| `shipping_method` | TEXT | Méthode de livraison |
| `shipping_address` | JSONB | Adresse de livraison |
| `delivery_duration_days` | INTEGER | Durée de livraison en jours |
| `shipped_at` | TIMESTAMP | Date d'expédition |
| `estimated_delivery_date` | TIMESTAMP | Date estimée de livraison |
| `delivered_at` | TIMESTAMP | Date réelle de livraison |
| `tracking_number` | TEXT | Numéro de suivi |
| `carrier` | TEXT | Transporteur |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

## ✅ Checklist

- [ ] Exécuter la migration SQL
- [ ] Vérifier que les tables ont été créées
- [ ] Vérifier que les vues fonctionnent
- [ ] Tester avec des données de test
- [ ] Intégrer les composants dans les pages
- [ ] Tester le build: `npm run build`
- [ ] Déployer en production

## 🆘 Troubleshooting

### Erreur: "relation already exists"
- La table existe déjà
- Utilise `DROP TABLE IF EXISTS` avant de créer

### Erreur: "foreign key violation"
- Vérifier que `auth.users` existe
- Vérifier que les IDs existent

### Les vues ne s'affichent pas
- Exécuter les créations de tables d'abord
- Puis les vues

## 📝 Notes

- RLS est activé pour la sécurité
- Les indexes améliorent les performances
- Les triggers maintiennent `updated_at` automatiquement
- Les vues facilitent l'accès aux données
