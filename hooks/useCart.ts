'use client';

import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { CartItem, CartState } from '@/lib/types/cart';
import { useAuthToken } from './useAuthToken';

interface UseCartResult extends CartState {
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetchCart: () => Promise<void>;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthToken();

  // Load initial cart from Supabase on mount
  useEffect(() => {
    let mounted = true;
    const loadCartFromDB = async () => {
      // Skip if no token
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'get' }),
          credentials: 'include',
        });

        if (!response.ok) {
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

    // Listen for token changes (e.g., after login)
    const handleTokenChange = (e: CustomEvent) => {
      console.log('[useCart] Token changed event received:', e.detail ? 'token present' : 'token cleared');
      if (e.detail && mounted) {
        // Token was set, reload cart
        loadCartFromDB();
      } else if (!e.detail && mounted) {
        // Token was cleared, clear cart
        setItems([]);
      }
    };

    window.addEventListener('token-changed', handleTokenChange as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('token-changed', handleTokenChange as EventListener);
    };
  }, [token]); // Only depend on token, not getAuthHeaders

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = useCallback(async (item: CartItem) => {
    try {
      setLoading(true);
      console.log('[useCart] Adding item:', item);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

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
          const existingIndex = prevItems.findIndex(i => i.id === data.item.id);
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
  }, [token]);

  const removeItem = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'remove', item: { id } }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to remove item');
      }

      // Recharger le panier depuis la DB après suppression
      const cartHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        cartHeaders.Authorization = `Bearer ${token}`;
      }

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
  }, [token]);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    try {
      setLoading(true);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'update', item: { id, quantity, name: '', price: 0, image: '' } }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to update quantity');
      }

      // Recharger le panier depuis la DB après mise à jour
      const cartHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        cartHeaders.Authorization = `Bearer ${token}`;
      }

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
  }, [token]);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

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
  }, [token]);

  const refetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'get' }),
        credentials: 'include',
      });

      if (!response.ok) {
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
  }, [token]);

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
