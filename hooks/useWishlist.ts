'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface WishlistItem {
    id: string;
    created_at: string;
    product_id: string;
    products: {
        id: string;
        name: string;
        price: number;
        image: string;
        slug: string;
        inStock: boolean;
    };
}

interface UseWishlistResult {
    items: WishlistItem[];
    loading: boolean;
    error: string | null;
    isInWishlist: (productId: string) => boolean;
    addToWishlist: (productId: string) => Promise<boolean>;
    removeFromWishlist: (productId: string) => Promise<boolean>;
    toggleWishlist: (productId: string) => Promise<boolean>;
    refetch: () => Promise<void>;
    count: number;
}

export function useWishlist(): UseWishlistResult {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const fetchWishlist = useCallback(async () => {
        if (!isAuthenticated || authLoading) {
            setItems([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/wishlist', {
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setItems([]);
                    return;
                }
                throw new Error('Erreur lors du chargement');
            }

            const data = await response.json();
            setItems(data.items || []);
        } catch (err: any) {
            setError(err.message);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const isInWishlist = useCallback((productId: string): boolean => {
        return items.some(item => item.product_id === productId || item.products?.id === productId);
    }, [items]);

    const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
        if (!isAuthenticated) {
            setError('Vous devez être connecté');
            return false;
        }

        try {
            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ productId }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout');
            }

            await fetchWishlist();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    }, [isAuthenticated, fetchWishlist]);

    const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
        if (!isAuthenticated) {
            setError('Vous devez être connecté');
            return false;
        }

        try {
            const response = await fetch(`/api/wishlist?productId=${productId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }

            // Optimistic update
            setItems(prev => prev.filter(item => item.product_id !== productId && item.products?.id !== productId));
            return true;
        } catch (err: any) {
            setError(err.message);
            await fetchWishlist(); // Revert on error
            return false;
        }
    }, [isAuthenticated, fetchWishlist]);

    const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
        if (isInWishlist(productId)) {
            return removeFromWishlist(productId);
        } else {
            return addToWishlist(productId);
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist]);

    return {
        items,
        loading,
        error,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refetch: fetchWishlist,
        count: items.length,
    };
}
