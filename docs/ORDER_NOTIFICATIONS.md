# 🔔 Automated Order Notification System

## Overview

Système automatisé de notifications WhatsApp pour les nouvelles commandes utilisant Upstash Redis pour la prévention des doublons et CallMeBot pour l'envoi des messages.

## Architecture

```
Order Creation Flow:
┌─────────────────┐
│  User Places    │
│     Order       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ createOrder()   │◄─── Standard checkout
│ createCODOrder()│◄─── Cash on Delivery
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Save to DB     │
│   (Supabase)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Redis for │
│   Duplicate     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Found    Not Found
    │         │
    │         ▼
    │   ┌─────────────┐
    │   │Send WhatsApp│
    │   │Notification │
    │   └──────┬──────┘
    │          │
    │          ▼
    │   ┌─────────────┐
    │   │ Mark in     │
    │   │   Redis     │
    │   └─────────────┘
    │
    ▼
┌─────────────────┐
│  Skip (logged)  │
└─────────────────┘
```

## Components

### 1. Redis Service (`lib/services/redis.ts`)

Gère le cache Redis pour la prévention des doublons :

- `hasNotificationBeenSent(orderId)` - Vérifie si une notification a déjà été envoyée
- `markNotificationAsSent(orderId)` - Marque une notification comme envoyée (TTL: 7 jours)
- `cacheOrderData(orderId, data)` - Cache les données de commande
- `checkRedisHealth()` - Vérifie la connexion Redis

### 2. Order Notification Service (`lib/services/order-notifications.ts`)

Service de notification avec prévention des doublons :

- `sendNewOrderNotification(data)` - Envoie une notification pour une nouvelle commande
- `formatCustomerName(address)` - Formate le nom du client
- `extractCustomerContact(address)` - Extrait email et téléphone

### 3. Order Service Integration (`lib/order-service.ts`)

Intégration dans le flux de création de commandes :

- Notifications automatiques après `createOrder()`
- Notifications automatiques après `createCODOrder()`
- Exécution asynchrone (n'affecte pas la création de commande)

## Configuration

### Variables d'environnement (`.env.local`)

```bash
# WhatsApp Notifications
CALLMEBOT_API_KEY=5693680
MANAGER_WHATSAPP=212701193811

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://mighty-troll-40243.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AZ0zAAIncDJiNTBhNGM4NTRmZTc0ZjgwODRkOTUxMjRmYzk4ZDZkZnAyNDAyNDM"

# Upstash QStash (pour usage futur)
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="eyJVc2VySUQiOiI2ODg5NmZhYy01NjQwLTQ1YzgtYWY1ZC0xOWY4YzZmYzYxZjkiLCJQYXNzd29yZCI6ImQwYTM2YTM3NjQ5MzRkYjA5ZDQ1MmRkNjAyMGMyZGQ1In0="
```

## Utilisation

### Automatique

Le système fonctionne automatiquement lors de la création de commandes :

```typescript
// Commande standard
const order = await createOrder(userId, checkoutData);
// ✅ Notification envoyée automatiquement

// Commande COD
const codOrder = await createCODOrder(userId, codData);
// ✅ Notification envoyée automatiquement
```

### Manuel (si nécessaire)

```typescript
import { sendNewOrderNotification } from '@/lib/services/order-notifications';

await sendNewOrderNotification({
  orderId: 'order-uuid',
  orderNumber: 'ORD-123456',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+212600000000',
  total: 25000,
  itemCount: 3,
  shippingMethod: 'express',
});
```

## Format de notification WhatsApp

```
🛍️ *Nouvelle commande*

🔖 *N°:* ORD-1732262400000
👤 *Client:* John Doe
📦 *Articles:* 3
💰 *Total:* 25 000 FCFA

Préparez la commande rapidement !
```

## Tests

### Test automatisé

```bash
node test-order-notifications.js
```

Ce script teste :
1. ✅ Variables d'environnement
2. ✅ Connexion Redis
3. ✅ Création de commande test
4. ✅ Envoi de notification
5. ✅ Prévention des doublons
6. ✅ Nettoyage

### Test manuel

1. Créer une commande via l'interface utilisateur
2. Vérifier la console pour les logs :
   ```
   [OrderNotification] ✅ Sent notification for order: ORD-xxx
   [Redis] ✅ Marked notification as sent for order: xxx
   ```
3. Vérifier la réception du message WhatsApp sur le téléphone du manager

## Prévention des doublons

Le système utilise Redis pour éviter l'envoi de notifications en double :

- **Clé Redis** : `notification:order:{orderId}`
- **TTL** : 7 jours (604800 secondes)
- **Comportement** : Si la clé existe, la notification est ignorée

### Exemple de logs

```
[OrderNotification] ⏭️ Skipping duplicate notification for order: ORD-123
```

## Gestion des erreurs

### Échec de Redis
- **Comportement** : Fail-open (permet l'envoi de la notification)
- **Log** : `[Redis] Error checking notification status`

### Échec de CallMeBot
- **Comportement** : Log l'erreur, ne bloque pas la création de commande
- **Log** : `Failed to send order notification`

### Échec de création de commande
- **Comportement** : Aucune notification envoyée
- **Raison** : Le bloc `finally` vérifie `order?.id`

## Monitoring

### Logs à surveiller

```bash
# Succès
[OrderNotification] ✅ Sent notification for order: ORD-xxx
[Redis] ✅ Marked notification as sent for order: xxx

# Doublons (normal)
[OrderNotification] ⏭️ Skipping duplicate notification for order: ORD-xxx

# Erreurs (à investiguer)
[Redis] Error checking notification status
Failed to send order notification
[WhatsApp] ⚠️ CallMeBot API key not configured
```

### Vérification Redis (Upstash Console)

1. Aller sur https://console.upstash.com/
2. Sélectionner votre base Redis
3. Utiliser le Data Browser pour voir les clés :
   - `notification:order:*` - Notifications envoyées

## Évolution future

### QStash pour tâches planifiées

Le système est prêt pour l'intégration de QStash :

```typescript
import { Client } from "@upstash/qstash";

const client = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Planifier une vérification périodique
await client.publishJSON({
  url: "https://your-domain.com/api/cron/check-orders",
  body: { action: "check_pending_orders" },
});
```

### Extensions possibles

- ✅ Notifications pour nouvelles commandes (implémenté)
- 🔄 Notifications pour changements de statut
- 🔄 Vérification automatique des paiements
- 🔄 Rappels pour commandes en attente
- 🔄 Notifications de livraison

## Dépendances

```json
{
  "@upstash/redis": "^1.35.6",
  "@upstash/qstash": "^2.7.0"
}
```

## Sécurité

- ✅ Clés API stockées dans `.env.local` (non versionnées)
- ✅ Utilisation de variables d'environnement
- ✅ Pas de données sensibles dans les logs
- ✅ TTL sur les clés Redis pour limiter la rétention

## Support

Pour toute question ou problème :
1. Vérifier les logs de l'application
2. Vérifier la console Upstash Redis
3. Tester avec `test-order-notifications.js`
4. Vérifier la configuration CallMeBot
