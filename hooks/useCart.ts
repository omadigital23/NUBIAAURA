'use client';

import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { CartItem, CartState } from '@/lib/types/cart';

interface UseCartResult extends CartState {
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial cart from Supabase on mount
  useEffect(() => {
    let mounted = true;
    const loadCartFromDB = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get' }),
        });

        if (!response.ok) {
          console.error('[useCart] Failed to load cart:', response.status);
          return;
        }

        const data = await response.json();
        if (mounted && data.items) {
          setItems(data.items);
        }
      } catch (err) {
        console.error('[useCart] Error loading cart:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCartFromDB();
    return () => { mounted = false; };
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = useCallback(async (item: CartItem) => {
    try {
      setLoading(true);
      console.log('[useCart] Adding item:', item);
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', item }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to add item');
      }
      
      const data = await response.json();
      console.log('[useCart] API response:', data);
      
      // Recharger le panier depuis la DB après ajout
      if (data.success) {
        const cartResponse = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get' }),
        });
        
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          if (cartData.items) {
            setItems(cartData.items);
          }
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('[useCart] Add item error:', err);
      setError(err instanceof Error ? err.message : 'Error adding item');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', item: { id } }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to remove item');
      }

      // Recharger le panier depuis la DB après suppression
      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get' }),
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

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', item: { id, quantity, name: '', price: 0, image: '' } }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        throw new Error(errorData.error || 'Failed to update quantity');
      }
      
      // Recharger le panier depuis la DB après mise à jour
      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get' }),
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
    try {
      setLoading(true);
      
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return {
    items,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    loading,
    error,
  };
}
