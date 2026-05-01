'use client';

import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { CartItem, CartState } from '@/lib/types/cart';

interface UseCartResult extends CartState {
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string, variantId?: string | null) => Promise<void>;
  updateQuantity: (id: string, quantity: number, variantId?: string | null) => Promise<void>;
  clearCart: () => Promise<void>;
  refetchCart: () => Promise<void>;
}

const getCartItemKey = (item: Pick<CartItem, 'id' | 'variantId'>) =>
  `${item.id}:${item.variantId || 'base'}`;

const isE2E = process.env.NEXT_PUBLIC_E2E === '1';
const e2eInitialItems: CartItem[] = [
  {
    id: 'e2e-product',
    name: 'Produit E2E',
    price: 25000,
    quantity: 1,
    image: '/images/logo_nubia_aura.png',
    variantId: null,
    size: null,
    color: null,
  },
];

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>(isE2E ? e2eInitialItems : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial cart from Supabase on mount
  useEffect(() => {
    if (isE2E) {
      return;
    }

    let mounted = true;
    const loadCartFromDB = async () => {
      try {
        setLoading(true);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'get' }),
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            if (mounted) {
              setItems([]);
              setError(null);
            }
            return;
          }

          console.error('[useCart] Failed to load cart:', response.status);
          return;
        }

        const data = await response.json();
        if (mounted && data.items) {
          setItems(data.items);
          console.log('[useCart] Cart loaded successfully:', data.items.length, 'items');
        }
      } catch (err) {
        console.error('[useCart] Error loading cart:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCartFromDB();

    // Listen for session changes (e.g., after login)
    const handleTokenChange = (e: CustomEvent) => {
      console.log('[useCart] Session changed event received:', e.detail ? 'session present' : 'session cleared');
      if (e.detail && mounted) {
        loadCartFromDB();
      } else if (!e.detail && mounted) {
        setItems([]);
      }
    };

    window.addEventListener('token-changed', handleTokenChange as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('token-changed', handleTokenChange as EventListener);
    };
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = useCallback(async (item: CartItem) => {
    try {
      setLoading(true);
      console.log('[useCart] Adding item:', item);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'add', item }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to add item');
      }

      const data = await response.json();
      console.log('[useCart] API response:', data);

      // Mettre à jour l'état local immédiatement
      if (data.success && data.item) {
        setItems(prevItems => {
          const incomingKey = getCartItemKey(data.item);
          const existingIndex = prevItems.findIndex(i => getCartItemKey(i) === incomingKey);
          if (existingIndex >= 0) {
            // Mettre à jour la quantité si l'item existe déjà
            const updatedItems = [...prevItems];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: data.item.quantity
            };
            return updatedItems;
          } else {
            // Ajouter le nouvel item
            return [...prevItems, data.item];
          }
        });
      }

      setError(null);
    } catch (err) {
      console.error('[useCart] Add item error:', err);
      setError(err instanceof Error ? err.message : 'Error adding item');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (id: string, variantId?: string | null) => {
    try {
      setLoading(true);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'remove', item: { id, variantId: variantId || null } }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to remove item');
      }

      // Recharger le panier depuis la DB après suppression
      const cartHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: cartHeaders,
        body: JSON.stringify({ action: 'get' }),
        credentials: 'include',
      });

      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        if (cartData.items) {
          setItems(cartData.items);
        }
      }

      setError(null);
    } catch (err) {
      console.error('[useCart] Remove item error:', err);
      setError(err instanceof Error ? err.message : 'Error removing item');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (id: string, quantity: number, variantId?: string | null) => {
    try {
      setLoading(true);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'update', item: { id, variantId: variantId || null, quantity, name: '', price: 0, image: '' } }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to update quantity');
      }

      // Recharger le panier depuis la DB après mise à jour
      const cartHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: cartHeaders,
        body: JSON.stringify({ action: 'get' }),
        credentials: 'include',
      });

      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        if (cartData.items) {
          setItems(cartData.items);
        }
      }

      setError(null);
    } catch (err) {
      console.error('[useCart] Update quantity error:', err);
      setError(err instanceof Error ? err.message : 'Error updating quantity');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    if (isE2E) {
      setItems([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] Clear cart API error:', errorData);
        throw new Error(errorData.error || 'Failed to clear cart');
      }

      setItems([]);
      setError(null);
      console.log('[useCart] Cart cleared successfully');
    } catch (err) {
      console.error('[useCart] Clear cart error:', err);
      setError(err instanceof Error ? err.message : 'Error clearing cart');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'get' }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setItems([]);
          setError(null);
          return;
        }

        console.error('[useCart] Failed to refetch cart:', response.status);
        return;
      }

      const data = await response.json();
      if (data.items) {
        setItems(data.items);
        console.log('[useCart] Cart refetched successfully:', data.items.length, 'items');
      }
    } catch (err) {
      console.error('[useCart] Error refetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refetchCart,
    loading,
    error,
  };
}
