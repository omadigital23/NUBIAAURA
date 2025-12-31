/**
 * 🧪 Auth API Tests
 * Unit tests for authentication endpoints with security measures
 * 
 * Run: npm test -- __tests__/api/auth.test.ts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/rate-limit-upstash', () => ({
    authRateLimit: {
        limit: jest.fn(async () => ({
            success: true,
            limit: 5,
            remaining: 4,
            reset: Date.now() + 60000,
        })),
    },
    adminRateLimit: {
        limit: jest.fn(async () => ({
            success: true,
            limit: 3,
            remaining: 2,
            reset: Date.now() + 60000,
        })),
    },
    getClientIdentifier: jest.fn(() => '192.168.1.1'),
    addRateLimitHeaders: jest.fn(),
}));

jest.mock('@/lib/sanitize', () => ({
    sanitizeEmail: jest.fn((email: string) => email?.toLowerCase().trim() || ''),
    sanitizeText: jest.fn((text: string) => text?.trim() || ''),
}));

jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
}));

jest.mock('@/lib/analytics-config', () => ({
    trackLogin: jest.fn(),
    trackSignUp: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signInWithPassword: jest.fn(async ({ email, password }: { email: string; password: string }) => {
                if (email === 'valid@example.com' && password === 'correctpassword') {
                    return {
                        data: {
                            user: { id: 'user-123', email: 'valid@example.com' },
                            session: { access_token: 'mock-token-123' },
                        },
                        error: null,
                    };
                }
                return {
                    data: null,
                    error: { message: 'Invalid credentials' },
                };
            }),
            admin: {
                createUser: jest.fn(async ({ email }: { email: string }) => {
                    if (email === 'existing@example.com') {
                        return {
                            data: null,
                            error: { message: 'User already exists' },
                        };
                    }
                    return {
                        data: {
                            user: { id: 'new-user-123', email },
                        },
                        error: null,
                    };
                }),
                deleteUser: jest.fn(),
            },
        },
        from: jest.fn(() => ({
            insert: jest.fn().mockImplementation(async () => ({ error: null })),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
        })),
    })),
}));

import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as signupPOST } from '@/app/api/auth/signup/route';
import * as Sentry from '@sentry/nextjs';
import { authRateLimit } from '@/lib/rate-limit-upstash';
import { sanitizeEmail, sanitizeText } from '@/lib/sanitize';
import { trackLogin, trackSignUp } from '@/lib/analytics-config';

describe('Auth API - Login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limiting on login attempts', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                }),
            });

            await loginPOST(request);
            expect(authRateLimit?.limit).toHaveBeenCalled();
        });

        it('should return 429 when login rate limit is exceeded', async () => {
            if (authRateLimit && authRateLimit.limit) {
                (authRateLimit.limit as jest.Mock).mockImplementation(async () => ({
                    success: false,
                    limit: 5,
                    remaining: 0,
                    reset: Date.now() + 60000,
                }));
            }

            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'attacker@example.com',
                    password: 'wrongpassword',
                }),
            });

            const response = await loginPOST(request);
            expect(response.status).toBe(429);

            const data = await response.json();
            expect(data.error).toContain('Trop de tentatives');
            expect(data.retryAfter).toBeDefined();
        });
    });

    describe('Input Sanitization', () => {
        it('should sanitize email input', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: '  TEST@EXAMPLE.COM  ',
                    password: 'password123',
                }),
            });

            await loginPOST(request);
            expect(sanitizeEmail).toHaveBeenCalledWith('  TEST@EXAMPLE.COM  ');
        });

        it('should handle malicious email input', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: '<script>alert("xss")</script>@example.com',
                    password: 'password123',
                }),
            });

            await loginPOST(request);
            expect(sanitizeEmail).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should capture login errors in Sentry', async () => {
            const { createClient } = await import('@supabase/supabase-js');
            (createClient as jest.Mock).mockReturnValueOnce({
                auth: {
                    signInWithPassword: jest.fn(async () => {
                        throw new Error('Database error');
                    }),
                },
            });

            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                }),
            });

            await loginPOST(request);
            expect(Sentry.captureException).toHaveBeenCalled();

            const captureCall = (Sentry.captureException as jest.Mock).mock.calls[0] as any;
            expect(captureCall[1].tags.route).toBe('auth/login');
        });

        it('should return 401 for invalid credentials', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                }),
            });

            const response = await loginPOST(request);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.error).toContain('incorrect');
        });

        it('should return 400 for Zod validation errors', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: '',
                }),
            });

            const response = await loginPOST(request);
            expect(response.status).toBe(400);
        });
    });

    describe('Analytics Tracking', () => {
        it('should track successful login', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'valid@example.com',
                    password: 'correctpassword',
                }),
            });

            await loginPOST(request);
            expect(trackLogin).toHaveBeenCalledWith('email');
        });

        it('should not track failed login attempts', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                }),
            });

            await loginPOST(request);
            expect(trackLogin).not.toHaveBeenCalled();
        });
    });

    describe('Session Management', () => {
        it('should set session cookie on successful login', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'valid@example.com',
                    password: 'correctpassword',
                }),
            });

            const response = await loginPOST(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.token).toBeDefined();
            expect(data.user).toBeDefined();
        });
    });
});

describe('Auth API - Signup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limiting on signup attempts', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'new@example.com',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe',
                }),
            });

            await signupPOST(request);
            expect(authRateLimit?.limit).toHaveBeenCalled();
        });
    });

    describe('Input Sanitization', () => {
        it('should sanitize email and names', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: '  NEW@EXAMPLE.COM  ',
                    password: 'password123',
                    firstName: '  John  ',
                    lastName: '  Doe  ',
                }),
            });

            await signupPOST(request);
            expect(sanitizeEmail).toHaveBeenCalled();
            expect(sanitizeText).toHaveBeenCalled();
        });
    });

    describe('Analytics Tracking', () => {
        it('should track successful signup', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'newuser@example.com',
                    password: 'password123',
                    firstName: 'Jane',
                    lastName: 'Smith',
                }),
            });

            await signupPOST(request);
            expect(trackSignUp).toHaveBeenCalledWith('email');
        });
    });

    describe('Error Handling', () => {
        it('should capture signup errors in Sentry', async () => {
            const { createClient } = await import('@supabase/supabase-js');
            (createClient as jest.Mock).mockReturnValueOnce({
                auth: {
                    admin: {
                        createUser: jest.fn(async () => {
                            throw new Error('Database error');
                        }),
                    },
                },
            });

            const request = new NextRequest('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'Test',
                    lastName: 'User',
                }),
            });

            await signupPOST(request);
            expect(Sentry.captureException).toHaveBeenCalled();

            const captureCall = (Sentry.captureException as jest.Mock).mock.calls[0] as any;
            expect(captureCall[1].tags.route).toBe('auth/signup');
        });

        it('should handle duplicate user error', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'existing@example.com',
                    password: 'password123',
                    firstName: 'Existing',
                    lastName: 'User',
                }),
            });

            const response = await signupPOST(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toBeDefined();
        });
    });
});
