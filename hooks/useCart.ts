'use client';

import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { clearPersistedCart, loadCart, saveCart } from '@/lib/cartPersistence';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface UseCartResult {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  loading: boolean;
  error: string | null;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial cart from persistence
  useEffect(() => {
    let mounted = true;
    (async () => {
      const persisted = await loadCart();
      if (!mounted) return;
      setItems(persisted);
    })();
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
      const normalized: CartItem = data.item ?? item;
      setItems(prev => {
        const existing = prev.find(i => i.id === normalized.id);
        if (existing) {
          const next = prev.map(i => (i.id === normalized.id ? { ...i, quantity: i.quantity + normalized.quantity } : i));
          saveCart(next);
          return next;
        }
        const next = [...prev, normalized];
        saveCart(next);
        return next;
      });
      setError(null);
    } catch (err) {
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

      if (!response.ok) throw new Error('Failed to remove item');

      setItems(prev => {
        const next = prev.filter(i => i.id !== id);
        saveCart(next);
        return next;
      });
      setError(null);
    } catch (err) {
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
        body: JSON.stringify({ action: 'update', item: { id, quantity } }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');
      const data = await response.json();
      const normalized: CartItem = data.item ?? { id, name: '', price: 0, quantity, image: '' };
      setItems(prev => {
        const exists = prev.find(i => i.id === id);
        if (!exists) {
          const next = [...prev, normalized];
          saveCart(next);
          return next;
        }
        const next = prev.map(i => (i.id === id ? { ...i, quantity } : i));
        saveCart(next);
        return next;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating quantity');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    clearPersistedCart();
    setError(null);
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
