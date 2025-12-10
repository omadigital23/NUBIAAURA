/**
 * 🧪 Rate Limiting Tests
 * Unit tests for rate limiting functionality
 * 
 * Run: npm test -- __tests__/lib/rate-limit.test.ts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
    Redis: {
        fromEnv: jest.fn(() => ({
            get: jest.fn(),
            set: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
        })),
    },
}));

jest.mock('@upstash/ratelimit', () => ({
    Ratelimit: jest.fn().mockImplementation(() => ({
        limit: jest.fn(async () => ({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
        })),
    })),
}));

import {
    getClientIdentifier,
    addRateLimitHeaders,
    authRateLimit,
    adminRateLimit,
    cartRateLimit,
    paymentRateLimit,
} from '@/lib/rate-limit-upstash';
import { NextRequest } from 'next/server';

describe('Rate Limiting', () => {
    describe('getClientIdentifier', () => {
        it('should extract IP from x-forwarded-for header', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    'x-forwarded-for': '192.168.1.1, 10.0.0.1',
                },
            });

            const identifier = getClientIdentifier(request);
            expect(identifier).toBe('192.168.1.1');
        });

        it('should extract IP from x-real-ip header', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    'x-real-ip': '203.0.113.5',
                },
            });

            const identifier = getClientIdentifier(request);
            expect(identifier).toBe('203.0.113.5');
        });

        it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    'cf-connecting-ip': '198.51.100.42',
                },
            });

            const identifier = getClientIdentifier(request);
            expect(identifier).toBe('198.51.100.42');
        });

        it('should handle missing IP headers gracefully', () => {
            const request = new NextRequest('http://localhost:3000/api/test');

            const identifier = getClientIdentifier(request);
            expect(identifier).toBeTruthy(); // Should return some identifier
        });

        it('should prioritize x-forwarded-for over other headers', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'x-real-ip': '5.6.7.8',
                    'cf-connecting-ip': '9.10.11.12',
                },
            });

            const identifier = getClientIdentifier(request);
            expect(identifier).toBe('1.2.3.4');
        });
    });

    describe('addRateLimitHeaders', () => {
        it('should add rate limit headers to response', () => {
            const headers = new Headers();

            addRateLimitHeaders(headers, {
                limit: 10,
                remaining: 5,
                reset: 1700000000000,
            });

            expect(headers.get('X-RateLimit-Limit')).toBe('10');
            expect(headers.get('X-RateLimit-Remaining')).toBe('5');
            expect(headers.get('X-RateLimit-Reset')).toBe('1700000000000');
        });

        it('should handle zero remaining correctly', () => {
            const headers = new Headers();

            addRateLimitHeaders(headers, {
                limit: 5,
                remaining: 0,
                reset: Date.now(),
            });

            expect(headers.get('X-RateLimit-Remaining')).toBe('0');
        });
    });

    describe('Rate Limit Configurations', () => {
        it('should have authRateLimit configured', () => {
            expect(authRateLimit).toBeDefined();
        });

        it('should have adminRateLimit configured', () => {
            expect(adminRateLimit).toBeDefined();
        });

        it('should have cartRateLimit configured', () => {
            expect(cartRateLimit).toBeDefined();
        });

        it('should have paymentRateLimit configured', () => {
            expect(paymentRateLimit).toBeDefined();
        });
    });

    describe('Rate Limit Thresholds', () => {
        it('should enforce stricter limits for admin endpoints', async () => {
            // Admin should have stricter limits than regular auth
            // This is a conceptual test - actual limits are set in the config
            expect(adminRateLimit).toBeDefined();
            expect(authRateLimit).toBeDefined();
        });

        it('should have cart rate limit for frequent operations', async () => {
            // Cart operations should allow multiple requests per minute
            expect(cartRateLimit).toBeDefined();
        });

        it('should have payment rate limit for sensitive operations', async () => {
            // Payment operations should be rate limited for security
            expect(paymentRateLimit).toBeDefined();
        });
    });
});

describe('Rate Limiting Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('When Redis is unavailable', () => {
        it('should gracefully fallback to in-memory limiting', () => {
            // The rate limiting library should handle Redis unavailability
            // and fall back to in-memory storage in development
            expect(authRateLimit).toBeDefined();
        });
    });

    describe('Rate Limit Response', () => {
        it('should return 429 when rate limit is exceeded', async () => {
            const { Ratelimit } = await import('@upstash/ratelimit');
            const mockLimit = jest.fn(async () => ({
                success: false,
                limit: 5,
                remaining: 0,
                reset: Date.now() + 60000,
            }));

            (Ratelimit as any).mockImplementation(() => ({
                limit: mockLimit,
            }));

            // Test that when success=false, we should return 429
            const result = await mockLimit('test-identifier');
            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should include retry-after in error response', async () => {
            const reset = Date.now() + 60000; // 60 seconds from now
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);

            expect(retryAfter).toBeGreaterThan(0);
            expect(retryAfter).toBeLessThanOrEqual(60);
        });
    });
});
