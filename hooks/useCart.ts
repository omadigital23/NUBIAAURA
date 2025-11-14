'use client';

import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { clearPersistedCart, loadCart, saveCart } from '@/lib/cartPersistence';
import { CartItem, CartState } from '@/lib/types/cart';

interface UseCartResult extends CartState {
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
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
      
      // Appeler l'API backend
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', item }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        
        // Gérer les erreurs d'authentification
        if (errorData.code === 'AUTH_REQUIRED' || errorData.code === 'AUTH_INVALID') {
          throw new Error('Authentication required');
        }
        
        throw new Error(errorData.error || 'Failed to add item');
      }
      
      const data = await response.json();
      console.log('[useCart] API response:', data);
      
      // Mettre à jour l'état local avec la réponse de l'API
      if (data.success && data.item) {
        setItems(prev => {
          const existing = prev.find(i => i.id === data.item.id);
          if (existing) {
            const next = prev.map(i => (i.id === data.item.id ? data.item : i));
            saveCart(next);
            return next;
          }
          const next = [...prev, data.item];
          saveCart(next);
          return next;
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('[useCart] Add item error:', err);
      setError(err instanceof Error ? err.message : 'Error adding item');
      
      // En cas d'erreur API, fallback sur localStorage
      if (err instanceof Error && err.message.includes('Authentication')) {
        // Ne pas sauvegarder localement si erreur d'auth
        return;
      }
      
      // Fallback pour les autres erreurs
      setItems(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
          const next = prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i));
          saveCart(next);
          return next;
        }
        const next = [...prev, item];
        saveCart(next);
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      // Appeler l'API backend
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', item: { id } }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        
        if (errorData.code === 'AUTH_REQUIRED' || errorData.code === 'AUTH_INVALID') {
          throw new Error('Authentication required');
        }
        
        throw new Error(errorData.error || 'Failed to remove item');
      }

      setItems(prev => {
        const next = prev.filter(i => i.id !== id);
        saveCart(next);
        return next;
      });
      
      setError(null);
    } catch (err) {
      console.error('[useCart] Remove item error:', err);
      setError(err instanceof Error ? err.message : 'Error removing item');
      
      // Fallback localStorage si erreur non-auth
      if (err instanceof Error && !err.message.includes('Authentication')) {
        setItems(prev => {
          const next = prev.filter(i => i.id !== id);
          saveCart(next);
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    try {
      setLoading(true);
      
      // Appeler l'API backend
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', item: { id, quantity, name: '', price: 0, image: '' } }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] API error:', errorData);
        
        if (errorData.code === 'AUTH_REQUIRED' || errorData.code === 'AUTH_INVALID') {
          throw new Error('Authentication required');
        }
        
        throw new Error(errorData.error || 'Failed to update quantity');
      }
      
      const data = await response.json();
      
      if (quantity <= 0) {
        // Supprimer l'item si quantité = 0
        setItems(prev => {
          const next = prev.filter(i => i.id !== id);
          saveCart(next);
          return next;
        });
      } else {
        // Mettre à jour avec la réponse de l'API ou fallback
        const updatedItem = data.item || { id, name: '', price: 0, quantity, image: '' };
        setItems(prev => {
          const exists = prev.find(i => i.id === id);
          if (!exists) {
            const next = [...prev, updatedItem];
            saveCart(next);
            return next;
          }
          const next = prev.map(i => (i.id === id ? updatedItem : i));
          saveCart(next);
          return next;
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('[useCart] Update quantity error:', err);
      setError(err instanceof Error ? err.message : 'Error updating quantity');
      
      // Fallback localStorage si erreur non-auth
      if (err instanceof Error && !err.message.includes('Authentication')) {
        if (quantity <= 0) {
          setItems(prev => {
            const next = prev.filter(i => i.id !== id);
            saveCart(next);
            return next;
          });
        } else {
          setItems(prev => {
            const exists = prev.find(i => i.id === id);
            if (!exists) {
              const next = [...prev, { id, name: '', price: 0, quantity, image: '' }];
              saveCart(next);
              return next;
            }
            const next = prev.map(i => (i.id === id ? { ...i, quantity } : i));
            saveCart(next);
            return next;
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      
      // Appeler l'API backend
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCart] Clear cart API error:', errorData);
        
        // Continuer avec le clear local même si erreur API (sauf auth)
        if (errorData.code !== 'AUTH_REQUIRED' && errorData.code !== 'AUTH_INVALID') {
          setItems([]);
          clearPersistedCart();
          setError(null);
          return;
        }
      }
      
      setItems([]);
      clearPersistedCart();
      setError(null);
    } catch (err) {
      console.error('[useCart] Clear cart error:', err);
      setError(err instanceof Error ? err.message : 'Error clearing cart');
      
      // Fallback localStorage
      setItems([]);
      clearPersistedCart();
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
