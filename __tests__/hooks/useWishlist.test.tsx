/**
 * Tests for useWishlist Hook
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        isLoading: false,
    }),
}));

// Import after mocks
import { useWishlist } from '@/hooks/useWishlist';

describe('useWishlist Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                items: [],
                count: 0,
            }),
        });
    });

    it('should initialize with empty wishlist', async () => {
        const { result } = renderHook(() => useWishlist());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.items).toEqual([]);
        expect(result.current.count).toBe(0);
    });

    it('should fetch wishlist on mount', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                items: [
                    {
                        id: '1',
                        created_at: '2024-01-01',
                        products: { id: 'prod-1', name: 'Test Product' },
                    },
                ],
                count: 1,
            }),
        });

        const { result } = renderHook(() => useWishlist());

        await waitFor(() => {
            expect(result.current.items.length).toBe(1);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/wishlist', expect.any(Object));
    });

    it('should check if product is in wishlist', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                items: [
                    {
                        id: '1',
                        created_at: '2024-01-01',
                        products: { id: 'prod-1', name: 'Test Product' },
                    },
                ],
            }),
        });

        const { result } = renderHook(() => useWishlist());

        await waitFor(() => {
            expect(result.current.items.length).toBe(1);
        });

        expect(result.current.isInWishlist('prod-1')).toBe(true);
        expect(result.current.isInWishlist('prod-2')).toBe(false);
    });

    it('should add product to wishlist', async () => {
        const { result } = renderHook(() => useWishlist());

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        await act(async () => {
            const success = await result.current.addToWishlist('prod-new');
            expect(success).toBe(true);
        });

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/wishlist',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ productId: 'prod-new' }),
            })
        );
    });

    it('should remove product from wishlist', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                items: [
                    {
                        id: '1',
                        created_at: '2024-01-01',
                        products: { id: 'prod-1', name: 'Test Product' },
                    },
                ],
            }),
        });

        const { result } = renderHook(() => useWishlist());

        await waitFor(() => {
            expect(result.current.items.length).toBe(1);
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        await act(async () => {
            const success = await result.current.removeFromWishlist('prod-1');
            expect(success).toBe(true);
        });
    });

    it('should toggle wishlist state', async () => {
        const { result } = renderHook(() => useWishlist());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        // Toggle should add when not in wishlist
        await act(async () => {
            await result.current.toggleWishlist('new-product');
        });

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/wishlist',
            expect.objectContaining({ method: 'POST' })
        );
    });
});
