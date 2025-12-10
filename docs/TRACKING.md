# Système de Tracking - Documentation

## 📊 Vue d'ensemble

Ce système de tracking fournit une solution complète pour suivre les interactions des utilisateurs dans l'application Nubia Aura. Il intègre:

- **Google Analytics 4** - Pour les métriques générales
- **Événements personnalisés** - Pour les actions métier
- **Backend tracking** - Pour l'analyse avancée
- **Gestion des sessions** - Pour suivre les utilisateurs

## 🚀 Installation

### 1. Configuration des variables d'environnement

Ajouter à `.env.local`:

```env
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Tracking
NEXT_PUBLIC_TRACKING_ENABLED=true
NEXT_PUBLIC_TRACKING_BACKEND_ENABLED=true
```

### 2. Ajouter Google Analytics au layout

```tsx
// app/layout.tsx
import GoogleAnalytics from '@/components/GoogleAnalytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GoogleAnalytics />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. Appliquer la migration de base de données

```bash
# Utiliser Supabase CLI
supabase migration up

# Ou exécuter manuellement
# Copier le contenu de migrations/create_tracking_events_table.sql
# Et l'exécuter dans Supabase SQL Editor
```

## 📝 Utilisation

### Tracking automatique des pages

Le tracking des pages est automatique avec le hook `useTracking()`:

```tsx
'use client';

import { useTracking } from '@/hooks/useTracking';

export default function MyPage() {
  const { trackProductView } = useTracking();

  return <div>Page content</div>;
}
```

### Tracker un produit consulté

```tsx
'use client';

import { useTracking } from '@/hooks/useTracking';

export default function ProductPage({ product }) {
  const { trackProductView } = useTracking();

  useEffect(() => {
    trackProductView({
      product_id: product.id,
      product_name: product.name,
      product_category: product.category,
      product_price: product.price,
      product_image_url: product.image_url,
    });
  }, [product.id]);

  return <div>{product.name}</div>;
}
```

### Tracker un ajout au panier

```tsx
const { trackAddToCart } = useTracking();

const handleAddToCart = (product) => {
  trackAddToCart({
    product_id: product.id,
    product_name: product.name,
    product_price: product.price,
    product_quantity: quantity,
  });
  // ... rest of add to cart logic
};
```

### Tracker un achat

```tsx
const { trackPurchase } = useTracking();

const handlePurchaseComplete = (order) => {
  trackPurchase({
    transaction_id: order.id,
    value: order.total,
    currency: 'XOF',
    tax: order.tax,
    shipping: order.shipping,
    items: order.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.price,
      product_quantity: item.quantity,
    })),
    payment_method: order.payment_method,
    shipping_method: order.shipping_method,
  });
};
```

### Tracker une recherche

```tsx
const { trackProductSearch } = useTracking();

const handleSearch = (searchTerm) => {
  const results = searchProducts(searchTerm);
  trackProductSearch(searchTerm, results.length);
};
```

### Tracker des filtres

```tsx
const { trackFilterProducts } = useTracking();

const handleFilter = (filters) => {
  trackFilterProducts({
    category: filters.category,
    price_range: filters.priceRange,
    size: filters.size,
    color: filters.color,
  });
};
```

### Tracker un formulaire

```tsx
const { trackContactFormSubmit } = useTracking();

const handleSubmit = (formData) => {
  trackContactFormSubmit(formData.subject);
  // ... rest of form submission
};
```

### Tracker une inscription newsletter

```tsx
const { trackNewsletterSignup } = useTracking();

const handleNewsletterSignup = (email) => {
  trackNewsletterSignup(email);
  // ... rest of signup logic
};
```

### Tracker une commande personnalisée

```tsx
const { trackCustomOrderSubmit } = useTracking();

const handleCustomOrderSubmit = (category) => {
  trackCustomOrderSubmit(category);
  // ... rest of submission
};
```

## 🎯 Événements disponibles

### Page Events
- `page_view` - Affichage d'une page

### Product Events
- `product_view` - Consultation d'un produit
- `product_search` - Recherche de produits
- `filter_products` - Filtrage de produits
- `sort_products` - Tri de produits
- `share_product` - Partage d'un produit

### Cart Events
- `add_to_cart` - Ajout au panier
- `remove_from_cart` - Suppression du panier
- `view_cart` - Consultation du panier

### Checkout Events
- `begin_checkout` - Début du checkout
- `add_shipping_info` - Ajout info livraison
- `add_payment_info` - Ajout info paiement
- `purchase` - Achat complété

### User Events
- `user_signup` - Inscription utilisateur
- `user_login` - Connexion utilisateur
- `user_logout` - Déconnexion utilisateur

### Form Events
- `newsletter_signup` - Inscription newsletter
- `contact_form_submit` - Soumission formulaire contact
- `custom_order_submit` - Soumission commande personnalisée

### Order Events
- `view_order_details` - Consultation détails commande
- `initiate_return` - Initiation retour

## 📊 Accéder aux données

### Via Google Analytics
- Aller sur [Google Analytics](https://analytics.google.com)
- Sélectionner la propriété Nubia Aura
- Consulter les rapports

### Via l'API backend
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/tracking
```

### Via Supabase
```sql
-- Voir tous les événements
SELECT * FROM tracking_events ORDER BY timestamp DESC;

-- Voir les analytics
SELECT * FROM tracking_analytics;

-- Voir l'activité utilisateur
SELECT * FROM user_activity;

-- Voir l'activité session
SELECT * FROM session_activity;
```

## ⚙️ Configuration avancée

### Modifier la configuration

Éditer `lib/tracking-config.ts`:

```ts
export const trackingConfig = {
  // Désactiver certains événements
  events: {
    pageView: true,
    productView: false,  // Désactiver
    // ...
  },

  // Modifier le sampling rate
  samplingRate: 0.5,  // Track 50% of events

  // Activer/désactiver le debug
  debug: true,
};
```

### Événements personnalisés

```tsx
const { track } = useTracking();

track({
  event: 'custom_event',
  properties: {
    custom_property: 'value',
    another_property: 123,
  },
});
```

## 🔒 Confidentialité

Le système respecte:
- ✅ RGPD - Pas de données sensibles
- ✅ CCPA - Consentement utilisateur
- ✅ DNT - Respect du Do Not Track
- ✅ Anonymisation IP - Activée par défaut

## 🐛 Debugging

Activer le debug mode:

```ts
// lib/tracking-config.ts
debug: true
```

Les logs apparaîtront dans la console du navigateur avec le préfixe `[Tracking]`.

## 📈 KPIs à suivre

1. **Conversion funnel**
   - Product view → Add to cart → Purchase

2. **User engagement**
   - Session duration
   - Pages per session
   - Bounce rate

3. **Product performance**
   - Most viewed products
   - Most purchased products
   - Search queries

4. **Traffic sources**
   - Direct
   - Organic
   - Referral
   - Social

## 🚨 Troubleshooting

### Google Analytics ne reçoit pas les événements
- Vérifier que `NEXT_PUBLIC_GA_ID` est défini
- Vérifier que le script GA se charge (DevTools > Network)
- Vérifier que `gtag` est disponible dans `window`

### Backend tracking ne fonctionne pas
- Vérifier que `/api/tracking` est accessible
- Vérifier les logs serveur
- Vérifier que la table `tracking_events` existe

### Données manquantes
- Vérifier le sampling rate
- Vérifier que les événements ne sont pas désactivés dans la config
- Vérifier les filtres Google Analytics

## 📚 Ressources

- [Google Analytics 4 Documentation](https://support.google.com/analytics)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
