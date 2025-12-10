# Configuration du Système de Suivi de Livraison

## 🚀 Étapes d'installation

### 1. Exécuter les migrations SQL dans Supabase

Accède à ta console Supabase et exécute ces requêtes SQL dans l'ordre:

#### Migration 1: Ajouter les colonnes de suivi à la table `orders`

```sql
-- Add delivery tracking columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_duration_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT;
```

#### Migration 2: Créer la table `delivery_tracking`

```sql
-- Create delivery_tracking table for history
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status_date ON delivery_tracking(status_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery_date);
```

#### Migration 3: Activer RLS et créer les vues

```sql
-- Enable RLS
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_tracking
CREATE POLICY "Users can view their order delivery tracking" ON delivery_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Create a view for delivery countdown
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

-- Create a view for return eligibility
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

### 2. Vérifier que les colonnes ont été ajoutées

```sql
-- Vérifier les colonnes de la table orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

### 3. Mettre à jour les données existantes (optionnel)

Si tu as des commandes existantes, tu peux les initialiser:

```sql
-- Initialiser les dates de livraison estimées pour les commandes expédiées
UPDATE orders
SET 
  shipped_at = created_at + INTERVAL '1 day',
  estimated_delivery_date = created_at + INTERVAL '4 days',
  delivery_duration_days = 3
WHERE status = 'shipped' AND shipped_at IS NULL;

-- Marquer les anciennes commandes comme livrées
UPDATE orders
SET 
  delivered_at = created_at + INTERVAL '5 days',
  status = 'delivered'
WHERE status = 'shipped' AND delivered_at IS NULL;
```

## 📁 Fichiers créés

### Backend
- `app/api/admin/orders/[id]/delivery/route.ts` - API pour gérer la livraison (admin)
- `app/api/returns/eligibility/route.ts` - API pour vérifier l'éligibilité des retours

### Frontend
- `hooks/useDeliveryCountdown.ts` - Hook pour le compte à rebours
- `hooks/useReturnEligibility.ts` - Hook pour vérifier l'éligibilité des retours
- `components/DeliveryCountdown.tsx` - Composant affichage du compte à rebours
- `components/ReturnEligibilityBanner.tsx` - Composant affichage de l'éligibilité des retours

## 🎯 Fonctionnalités

### 1. Compte à rebours de livraison
- Affiche le temps restant jusqu'à la livraison estimée
- Met à jour en temps réel (chaque seconde)
- Affiche les jours, heures, minutes, secondes
- Barre de progression visuelle
- Couleurs différentes selon le statut (en attente, en transit, livré, retard)

### 2. Gestion de la durée de livraison (Admin)
- L'admin peut définir la durée de livraison pour chaque commande
- La date de livraison estimée est calculée automatiquement
- Chaque jour, le compte à rebours diminue de 1 jour
- Jusqu'au jour J (livraison)

### 3. Système de retour (72h après livraison)
- Les clients peuvent demander un retour dans les 72h après livraison
- Affichage du temps restant pour demander un retour
- Après 72h, le bouton de retour est désactivé
- Vérification automatique de l'éligibilité

## 💻 Utilisation dans les pages

### Afficher le compte à rebours

```tsx
import DeliveryCountdown from '@/components/DeliveryCountdown';

export default function OrderDetail({ order }) {
  return (
    <DeliveryCountdown
      estimatedDeliveryDate={order.estimated_delivery_date}
      deliveryDurationDays={order.delivery_duration_days}
      isDelivered={order.status === 'delivered'}
      shippedAt={order.shipped_at}
      showProgress={true}
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

### Endpoint: `PUT /api/admin/orders/[id]/delivery`

```bash
curl -X PUT http://localhost:3000/api/admin/orders/123/delivery \
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

### Réponse

```json
{
  "success": true,
  "order": {
    "id": "123",
    "order_number": "ORD-123",
    "status": "shipped",
    "delivery_duration_days": 3,
    "shipped_at": "2024-11-15T10:00:00Z",
    "estimated_delivery_date": "2024-11-18T10:00:00Z",
    "tracking_number": "TRACK123456",
    "carrier": "DHL"
  }
}
```

## 🔍 API Client - Vérifier l'éligibilité des retours

### Endpoint: `GET /api/returns/eligibility?orderId=123`

```bash
curl http://localhost:3000/api/returns/eligibility?orderId=123 \
  -H "Cookie: sb-auth-token=YOUR_TOKEN"
```

### Réponse (Éligible)

```json
{
  "eligible": true,
  "hoursSinceDelivery": 24,
  "hoursRemaining": 48,
  "returnDeadline": "2024-11-18T14:00:00Z",
  "deliveredAt": "2024-11-16T14:00:00Z"
}
```

### Réponse (Non éligible)

```json
{
  "eligible": false,
  "reason": "return_window_expired",
  "message": "Délai de retour expiré (4 jours depuis la livraison)",
  "hoursSinceDelivery": 96
}
```

## 📊 Vues SQL disponibles

### `order_delivery_countdown`
Affiche le compte à rebours pour chaque commande

```sql
SELECT * FROM order_delivery_countdown;
```

### `return_eligibility`
Affiche l'éligibilité des retours pour les commandes livrées

```sql
SELECT * FROM return_eligibility;
```

## 🐛 Troubleshooting

### Le compte à rebours ne s'affiche pas
- Vérifier que `estimated_delivery_date` est défini
- Vérifier que `shipped_at` est défini
- Vérifier que `delivery_duration_days` est défini

### L'éligibilité des retours ne fonctionne pas
- Vérifier que `delivered_at` est défini
- Vérifier que le statut de la commande est `delivered`
- Vérifier que moins de 72 heures se sont écoulées depuis la livraison

### Les migrations SQL échouent
- Vérifier que les colonnes n'existent pas déjà
- Vérifier que la table `orders` existe
- Vérifier les permissions Supabase

## ✅ Checklist de déploiement

- [ ] Exécuter les 3 migrations SQL
- [ ] Vérifier que les colonnes ont été ajoutées
- [ ] Mettre à jour les données existantes (optionnel)
- [ ] Tester le compte à rebours avec une commande
- [ ] Tester l'éligibilité des retours
- [ ] Intégrer les composants dans les pages
- [ ] Tester le build: `npm run build`
- [ ] Déployer en production
