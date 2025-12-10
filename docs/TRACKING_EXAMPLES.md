# Exemples d'intégration du Tracking

## 1. Tracker une consultation de produit

```tsx
// app/[locale]/produit/[slug]/page.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useEffect } from 'react';

export default function ProductPage({ product }) {
  const { trackProductView } = useTracking();

  useEffect(() => {
    if (product) {
      trackProductView({
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        product_image_url: product.image_url,
      });
    }
  }, [product?.id]);

  return (
    <div>
      <h1>{product.name}</h1>
      {/* Product details */}
    </div>
  );
}
```

## 2. Tracker l'ajout au panier

```tsx
// components/ProductDetailsClient.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useCart } from '@/hooks/useCart';

export default function ProductDetailsClient({ product }) {
  const { trackAddToCart } = useTracking();
  const { addToCart } = useCart();

  const handleAddToCart = async (quantity: number) => {
    // Track the event
    trackAddToCart({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_quantity: quantity,
      product_category: product.category,
    });

    // Add to cart
    await addToCart(product.id, quantity);
  };

  return (
    <button onClick={() => handleAddToCart(1)}>
      Ajouter au panier
    </button>
  );
}
```

## 3. Tracker la recherche de produits

```tsx
// components/ProductSearch.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useState } from 'react';

export default function ProductSearch() {
  const { trackProductSearch } = useTracking();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = async (term: string) => {
    const results = await searchProducts(term);
    
    // Track the search
    trackProductSearch(term, results.length);
    
    setSearchTerm(term);
  };

  return (
    <input
      type="text"
      placeholder="Rechercher..."
      onChange={(e) => handleSearch(e.target.value)}
    />
  );
}
```

## 4. Tracker les filtres

```tsx
// components/ProductFilters.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';

export default function ProductFilters() {
  const { trackFilterProducts } = useTracking();

  const handleFilterChange = (filters) => {
    // Track the filter
    trackFilterProducts({
      category: filters.category,
      price_min: filters.priceMin,
      price_max: filters.priceMax,
      size: filters.size,
      color: filters.color,
    });

    // Apply filters
    applyFilters(filters);
  };

  return (
    <div>
      {/* Filter UI */}
    </div>
  );
}
```

## 5. Tracker le début du checkout

```tsx
// app/[locale]/checkout/page.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useCart } from '@/hooks/useCart';
import { useEffect } from 'react';

export default function CheckoutPage() {
  const { trackBeginCheckout } = useTracking();
  const { cart } = useCart();

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      const totalValue = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      trackBeginCheckout(cart.items.length, totalValue);
    }
  }, [cart]);

  return (
    <div>
      {/* Checkout form */}
    </div>
  );
}
```

## 6. Tracker l'ajout des infos de livraison

```tsx
// components/ShippingForm.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';

export default function ShippingForm() {
  const { trackAddShippingInfo } = useTracking();

  const handleShippingMethodChange = (method: string, cost: number) => {
    // Track the shipping info
    trackAddShippingInfo(method, cost);

    // Update shipping
    updateShipping(method, cost);
  };

  return (
    <div>
      <button onClick={() => handleShippingMethodChange('standard', 5000)}>
        Livraison Standard (5000 FCFA)
      </button>
      <button onClick={() => handleShippingMethodChange('express', 10000)}>
        Livraison Express (10000 FCFA)
      </button>
    </div>
  );
}
```

## 7. Tracker l'ajout des infos de paiement

```tsx
// components/PaymentForm.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';

export default function PaymentForm() {
  const { trackAddPaymentInfo } = useTracking();

  const handlePaymentMethodChange = (method: string) => {
    // Track the payment info
    trackAddPaymentInfo(method);

    // Update payment method
    updatePaymentMethod(method);
  };

  return (
    <div>
      <button onClick={() => handlePaymentMethodChange('card')}>
        Carte bancaire
      </button>
      <button onClick={() => handlePaymentMethodChange('wave')}>
        Wave
      </button>
      <button onClick={() => handlePaymentMethodChange('orange_money')}>
        Orange Money
      </button>
    </div>
  );
}
```

## 8. Tracker un achat complété

```tsx
// app/[locale]/merci/page.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ThankYouPage() {
  const { trackPurchase } = useTracking();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const fetchAndTrackOrder = async () => {
      const order = await fetchOrder(orderId);

      trackPurchase({
        transaction_id: order.id,
        value: order.total,
        currency: 'XOF',
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        items: order.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.price,
          product_quantity: item.quantity,
          product_category: item.category,
        })),
        payment_method: order.payment_method,
        shipping_method: order.shipping_method,
      });
    };

    if (orderId) {
      fetchAndTrackOrder();
    }
  }, [orderId]);

  return (
    <div>
      <h1>Merci pour votre commande !</h1>
      {/* Order details */}
    </div>
  );
}
```

## 9. Tracker l'inscription newsletter

```tsx
// components/NewsletterForm.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useState } from 'react';

export default function NewsletterForm() {
  const { trackNewsletterSignup } = useTracking();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Track the signup
    trackNewsletterSignup(email);

    // Subscribe to newsletter
    await subscribeNewsletter(email);

    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre email"
      />
      <button type="submit">S'abonner</button>
    </form>
  );
}
```

## 10. Tracker le formulaire de contact

```tsx
// components/ContactForm.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useState } from 'react';

export default function ContactForm() {
  const { trackContactFormSubmit } = useTracking();
  const [formData, setFormData] = useState({ subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Track the form submission
    trackContactFormSubmit(formData.subject);

    // Send the form
    await sendContactForm(formData);

    setFormData({ subject: '', message: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        placeholder="Sujet"
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Message"
      />
      <button type="submit">Envoyer</button>
    </form>
  );
}
```

## 11. Tracker une commande personnalisée

```tsx
// components/CustomOrderForm.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useState } from 'react';

export default function CustomOrderForm() {
  const { trackCustomOrderSubmit } = useTracking();
  const [category, setCategory] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Track the custom order submission
    trackCustomOrderSubmit(category);

    // Submit the custom order
    await submitCustomOrder(category);

    setCategory('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Sélectionner une catégorie</option>
        <option value="robe">Robe</option>
        <option value="costume">Costume</option>
        <option value="chemise">Chemise</option>
      </select>
      <button type="submit">Commander</button>
    </form>
  );
}
```

## 12. Tracker la consultation des détails de commande

```tsx
// app/[locale]/commandes/[id]/page.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function OrderDetailPage() {
  const { trackViewOrderDetails } = useTracking();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    const fetchAndTrackOrder = async () => {
      const order = await fetchOrder(orderId);

      trackViewOrderDetails(orderId, order.total);
    };

    if (orderId) {
      fetchAndTrackOrder();
    }
  }, [orderId]);

  return (
    <div>
      {/* Order details */}
    </div>
  );
}
```

## 13. Tracker l'initiation d'un retour

```tsx
// components/ReturnForm.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useState } from 'react';

export default function ReturnForm({ orderId }) {
  const { trackInitiateReturn } = useTracking();
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Track the return initiation
    trackInitiateReturn(orderId, reason);

    // Submit the return
    await submitReturn(orderId, reason);

    setReason('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Raison du retour"
      />
      <button type="submit">Demander un retour</button>
    </form>
  );
}
```

## 14. Tracker le partage de produit

```tsx
// components/ShareProduct.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';

export default function ShareProduct({ productId }) {
  const { trackShareProduct } = useTracking();

  const handleShare = (platform: string) => {
    // Track the share
    trackShareProduct(productId, platform);

    // Share the product
    shareProduct(productId, platform);
  };

  return (
    <div>
      <button onClick={() => handleShare('facebook')}>
        Partager sur Facebook
      </button>
      <button onClick={() => handleShare('whatsapp')}>
        Partager sur WhatsApp
      </button>
      <button onClick={() => handleShare('twitter')}>
        Partager sur Twitter
      </button>
    </div>
  );
}
```

## 15. Tracker la connexion utilisateur

```tsx
// app/[locale]/auth/login/page.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const { trackUserLogin, setUserId } = useTracking();
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    const user = await loginUser(email);

    // Track the login
    trackUserLogin(email);

    // Set user ID for future tracking
    setUserId(user.id);

    router.push('/');
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

## 16. Tracker l'inscription utilisateur

```tsx
// app/[locale]/auth/signup/page.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const { trackUserSignup, setUserId } = useTracking();
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();

    const user = await signupUser(email);

    // Track the signup
    trackUserSignup(email);

    // Set user ID for future tracking
    setUserId(user.id);

    router.push('/');
  };

  return (
    <form onSubmit={handleSignup}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">S'inscrire</button>
    </form>
  );
}
```

## 17. Tracker la déconnexion utilisateur

```tsx
// components/LogoutButton.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const { trackUserLogout, clearUserId } = useTracking();
  const router = useRouter();

  const handleLogout = async () => {
    // Track the logout
    trackUserLogout();

    // Clear user ID
    clearUserId();

    // Logout
    await logoutUser();

    router.push('/');
  };

  return (
    <button onClick={handleLogout}>
      Se déconnecter
    </button>
  );
}
```

## 18. Tracker le tri de produits

```tsx
// components/ProductSort.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';

export default function ProductSort() {
  const { trackSortProducts } = useTracking();

  const handleSort = (sortBy: string) => {
    // Track the sort
    trackSortProducts(sortBy);

    // Apply sort
    applySortProducts(sortBy);
  };

  return (
    <select onChange={(e) => handleSort(e.target.value)}>
      <option value="relevance">Pertinence</option>
      <option value="price_asc">Prix croissant</option>
      <option value="price_desc">Prix décroissant</option>
      <option value="newest">Plus récent</option>
      <option value="rating">Meilleure note</option>
    </select>
  );
}
```

## 19. Tracker la consultation du panier

```tsx
// app/[locale]/panier/page.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useCart } from '@/hooks/useCart';
import { useEffect } from 'react';

export default function CartPage() {
  const { trackViewCart } = useTracking();
  const { cart } = useCart();

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      const totalValue = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      trackViewCart(cart.items.length, totalValue);
    }
  }, [cart]);

  return (
    <div>
      {/* Cart items */}
    </div>
  );
}
```

## 20. Tracker la suppression du panier

```tsx
// components/CartItem.tsx
'use client';

import { useTracking } from '@/hooks/useTracking';
import { useCart } from '@/hooks/useCart';

export default function CartItem({ item }) {
  const { trackRemoveFromCart } = useTracking();
  const { removeFromCart } = useCart();

  const handleRemove = () => {
    // Track the removal
    trackRemoveFromCart({
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.price,
      product_quantity: item.quantity,
    });

    // Remove from cart
    removeFromCart(item.id);
  };

  return (
    <button onClick={handleRemove}>
      Supprimer
    </button>
  );
}
```
