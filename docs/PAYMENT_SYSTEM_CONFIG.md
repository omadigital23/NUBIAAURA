# Configuration du Système de Paiement NUBIA AURA

## Architecture du Système

```
lib/payments/
├── types.ts               # Types TypeScript et interfaces
├── index.ts               # Exports centralisés
├── provider-factory.ts    # Factory pour créer les providers
└── providers/
    ├── chaabi.provider.ts # Maroc (MAD) - Banque Populaire
    ├── paytech.provider.ts # Sénégal (XOF) + International (USD)
    └── cod.provider.ts     # Paiement à la livraison (tous pays)

app/api/
├── payments/initialize/route.ts  # Endpoint d'initialisation unifié
└── webhooks/
    ├── chaabi/route.ts    # Webhook Chaabi Payment
    └── paytech/route.ts   # Webhook PayTech IPN
```

---

## Configuration des Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env.local`:

```env
# Chaabi Payment (Maroc)
CHAABI_API_KEY=votre_uuid_api_key
CHAABI_SECRET_KEY=votre_secret_key
CHAABI_GATEWAY_URL=https://payment.chaabi.ma/checkout

# PayTech (Sénégal + International)
PAYTECH_API_KEY=votre_api_key_paytech
PAYTECH_SECRET_KEY=votre_secret_key_paytech
PAYTECH_ENV=test  # 'test' pour sandbox, 'prod' pour production

# URL de base de l'application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

---

## Configuration PayTech Dashboard

### Obtenir vos clés API

1. Inscrivez-vous sur [PayTech](https://paytech.sn)
2. Accédez au **Dashboard → Paramètres → API**
3. Copiez votre `API_KEY` et `API_SECRET`

### Configurer les URLs dans le Dashboard PayTech

Dans **Paramètres → API → URLs de notification**:

| Champ | URL |
|-------|-----|
| **IPN (Instant Payment Notification)** | `https://votre-domaine.com/api/webhooks/paytech` |
| **URL de succès** | `https://votre-domaine.com/payments/callback?status=success&gateway=paytech` |
| **URL d'annulation** | `https://votre-domaine.com/payments/callback?status=cancelled&gateway=paytech` |

> **Note**: Ces URLs sont aussi envoyées dynamiquement à chaque requête de paiement, mais les configurer dans le dashboard sert de fallback.

### Activation du compte Production

Pour passer en mode production:

1. Envoyez un email à **contact@paytech.sn** avec "Activation Compte PayTech"
2. Joignez les documents requis:
   - Numéro NINEA
   - Pièce d'identité
   - Registre de commerce
   - Document de statut de l'entreprise
   - Justificatif de domicile
   - Numéro de téléphone

3. Délai: ~48h. Appelez **+221 77 125 57 99** pour le suivi.

---

## Méthodes de Paiement par Pays

| Pays | Gateway | Méthodes | Devise |
|------|---------|----------|--------|
| **Maroc (MA)** | Chaabi | Carte bancaire | MAD |
| **Sénégal (SN)** | PayTech | Wave, Orange Money, Free Money | XOF |
| **International** | PayTech | Carte bancaire (Visa, MC, Amex) | USD / EUR |
| **Tous pays** | COD | Paiement à la livraison | Locale |

---

## Paramètre `target_payment` PayTech

Pour cibler une méthode de paiement spécifique:

```javascript
// Méthode unique (auto-submit activé)
target_payment: "Orange Money"

// Plusieurs méthodes (utilisateur choisit)
target_payment: "Orange Money, Wave, Free Money"
```

### Méthodes disponibles:
- `Orange Money` / `Orange Money CI` / `Orange Money ML`
- `Wave` / `Wave CI`
- `Free Money`
- `Carte Bancaire`
- `Mtn Money CI` / `Mtn Money BJ`
- `Moov Money CI` / `Moov Money ML` / `Moov Money BJ`
- `Wizall` / `Emoney` / `Tigo Cash`

---

## Vérification des Webhooks (IPN)

PayTech envoie les notifications via POST avec ces champs:

```json
{
  "type_event": "sale_complete",  // ou "sale_canceled"
  "ref_command": "votre_order_id",
  "item_price": 5000,
  "payment_method": "Orange Money",
  "client_phone": "221777777777",
  "token": "abc123token",
  "api_key_sha256": "hash...",
  "api_secret_sha256": "hash...",
  "hmac_compute": "hmac..."  // Méthode recommandée
}
```

### Vérification HMAC-SHA256 (Recommandée)

```javascript
const message = `${item_price}|${ref_command}|${api_key}`;
const expectedHmac = crypto
  .createHmac('sha256', api_secret)
  .update(message)
  .digest('hex');

const isValid = payload.hmac_compute === expectedHmac;
```

### Vérification SHA256 (Fallback)

```javascript
const expectedKeyHash = crypto.createHash('sha256').update(api_key).digest('hex');
const expectedSecretHash = crypto.createHash('sha256').update(api_secret).digest('hex');

const isValid = (
  payload.api_key_sha256 === expectedKeyHash &&
  payload.api_secret_sha256 === expectedSecretHash
);
```

---

## Test en Mode Sandbox

En mode `env=test`:
- Montant débité: **100-150 CFA seulement** (quel que soit le montant réel)
- Utilisation: développement interne uniquement
- Ne pas utiliser pour transactions publiques

---

## Flux de Paiement

```
1. Client choisit "Payer"
   ↓
2. POST /api/payments/initialize
   ↓
3. Création commande en DB + Réservation stock
   ↓
4. Factory sélectionne le provider (Chaabi/PayTech/COD)
   ↓
5. Provider crée session → redirect_url retournée
   ↓
6. Client redirigé vers gateway de paiement
   ↓
7. Paiement effectué → Gateway envoie IPN
   ↓
8. POST /api/webhooks/{gateway}
   ↓
9. Vérification signature → Mise à jour commande
   ↓
10. Stock finalisé + Email confirmation
```

---

## Résumé des URLs à configurer

### Pour PayTech Dashboard:
```
IPN URL:      https://votre-domaine.com/api/webhooks/paytech
Success URL:  https://votre-domaine.com/payments/callback?status=success&gateway=paytech
Cancel URL:   https://votre-domaine.com/payments/callback?status=cancelled&gateway=paytech
```

### Pour Chaabi (si configuré dans leur dashboard):
```
Callback URL: https://votre-domaine.com/api/webhooks/chaabi
Success URL:  https://votre-domaine.com/payments/callback?status=success&gateway=chaabi
Fail URL:     https://votre-domaine.com/payments/callback?status=failed&gateway=chaabi
```
