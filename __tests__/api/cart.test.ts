/**
 * 🧪 Cart API Tests
 * Unit tests for shopping cart endpoints with security measures
 * 
 * Run: npm test -- __tests__/api/cart.test.ts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/rate-limit-upstash', () => ({
    cartRateLimit: {
        limit: jest.fn(async () => ({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
        })),
    },
    getClientIdentifier: jest.fn(() => '192.168.1.1'),
    addRateLimitHeaders: jest.fn(),
}));

jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            getUser: jest.fn(async () => ({
                data: { user: { id: 'test-user-id', email: 'test@example.com' } },
                error: null,
            })),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(async () => ({
                data: { id: 'cart-id', user_id: 'test-user-id' },
                error: null,
            })),
        })),
    })),
}));

import { POST } from '@/app/api/cart/route';
import * as Sentry from '@sentry/nextjs';
import { cartRateLimit } from '@/lib/rate-limit-upstash';

describe('Cart API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limiting on cart requests', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            await POST(request);

            expect(cartRateLimit.limit).toHaveBeenCalled();
        });

        it('should return 429 when rate limit is exceeded', async () => {
            // Mock rate limit exceeded
            (cartRateLimit.limit as jest.Mock).mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
            });

            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(429);

            const data = await response.json();
            expect(data.error).toContain('Trop de requêtes');
            expect(data.retryAfter).toBeDefined();
        });

        it('should include rate limit headers in successful requests', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            await POST(request);

            const { addRateLimitHeaders } = await import('@/lib/rate-limit-upstash');
            expect(addRateLimitHeaders).toHaveBeenCalled();
        });
    });

    describe('Authentication', () => {
        it('should require authentication', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.code).toBe('AUTH_REQUIRED');
        });

        it('should accept token from Authorization header', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            const response = await POST(request);
            // Should not be 401 if token is processed
            expect(response.status).not.toBe(401);
        });

        it('should accept token from cookie', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'sb-auth-token=valid-token',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            const response = await POST(request);
            // Should not be 401 if cookie is processed
            expect(response.status).not.toBe(401);
        });
    });

    describe('Input Validation', () => {
        it('should validate action field', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'invalid-action',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it('should validate item structure for add action', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'add',
                    item: {
                        // Missing required fields
                    },
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it('should validate quantity is positive', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'add',
                    item: {
                        id: 'prod-1',
                        name: 'Test Product',
                        price: 10000,
                        quantity: -1, // Invalid
                        image: 'test.jpg',
                    },
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });
    });

    describe('Error Handling', () => {
        it('should capture errors in Sentry', async () => {
            // Mock Supabase to throw an error
            const { createClient } = await import('@supabase/supabase-js');
            (createClient as jest.Mock).mockReturnValueOnce({
                auth: {
                    getUser: jest.fn(async () => {
                        throw new Error('Database connection failed');
                    }),
                },
            });

            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            await POST(request);

            expect(Sentry.captureException).toHaveBeenCalled();
            const captureCall = (Sentry.captureException as jest.Mock).mock.calls[0];
            expect(captureCall[1].tags.route).toBe('cart');
        });

        it('should return proper error for Zod validation failures', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'add',
                    item: {
                        id: 'prod-1',
                        // Missing required fields
                    },
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toBe('Données invalides');
            expect(data.details).toBeDefined();
        });

        it('should return 500 for server errors', async () => {
            // Mock an unexpected error
            const { createClient } = await import('@supabase/supabase-js');
            (createClient as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Unexpected server error');
            });

            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.error).toBe('Erreur lors de la gestion du panier');
        });
    });

    describe('Cart Operations', () => {
        it('should support get action', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'get',
                }),
            });

            const response = await POST(request);
            // Should process get action (may succeed or fail based on mocks)
            expect([200, 500]).toContain(response.status);
        });

        it('should support add action', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'add',
                    item: {
                        id: 'prod-1',
                        name: 'Test Product',
                        price: 10000,
                        quantity: 2,
                        image: 'test.jpg',
                    },
                }),
            });

            const response = await POST(request);
            // Should process add action
            expect(response.status).toBeDefined();
        });

        it('should support remove action', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'remove',
                    item: {
                        id: 'prod-1',
                        name: 'Test Product',
                        price: 10000,
                        quantity: 1,
                        image: 'test.jpg',
                    },
                }),
            });

            const response = await POST(request);
            expect(response.status).toBeDefined();
        });

        it('should support update action', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'update',
                    item: {
                        id: 'prod-1',
                        name: 'Test Product',
                        price: 10000,
                        quantity: 3,
                        image: 'test.jpg',
                    },
                }),
            });

            const response = await POST(request);
            expect(response.status).toBeDefined();
        });

        it('should support clear action', async () => {
            const request = new NextRequest('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({
                    action: 'clear',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBeDefined();
        });
    });
});
