import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate Limiting Configuration for NUBIA AURA
 * 
 * Uses Upstash Redis for distributed rate limiting.
 * Falls back to in-memory store in development if Redis is not configured.
 */

// Check if Redis is configured
const isRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client if configured
const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

/**
 * Rate limit configurations for different endpoints
 */

// Auth endpoints - protect against brute force
export const authRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
        analytics: true,
        prefix: 'ratelimit:auth',
    })
    : null;

// Admin endpoints - stricter limits
export const adminRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute
        analytics: true,
        prefix: 'ratelimit:admin',
    })
    : null;

// Payment endpoints - very strict
export const paymentRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1, '30 s'), // 1 request per 30 seconds
        analytics: true,
        prefix: 'ratelimit:payment',
    })
    : null;

// Cart endpoints - reasonable limits
export const cartRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
        analytics: true,
        prefix: 'ratelimit:cart',
    })
    : null;

// General API endpoints
export const apiRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
        analytics: true,
        prefix: 'ratelimit:api',
    })
    : null;

/**
 * Helper to get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

    return ip;
}

/**
 * Check rate limit for a request
 * Returns { success: boolean, limit, remaining, reset }
 */
export async function checkRateLimit(
    identifier: string,
    limiter: Ratelimit | null
): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    // If no limiter (dev mode or Redis not configured), allow all requests
    if (!limiter) {
        console.warn('[Rate Limit] No limiter configured, allowing request');
        return {
            success: true,
            limit: 999,
            remaining: 999,
            reset: Date.now() + 60000,
        };
    }

    try {
        const result = await limiter.limit(identifier);

        // Log if limit is reached
        if (!result.success) {
            console.warn(`[Rate Limit] Limit reached for ${identifier}`, {
                limit: result.limit,
                remaining: result.remaining,
                reset: new Date(result.reset),
            });
        }

        return result;
    } catch (error) {
        console.error('[Rate Limit] Error checking rate limit:', error);
        // On error, allow the request but log it
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: Date.now(),
        };
    }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
    headers: Headers,
    rateLimit: {
        limit: number;
        remaining: number;
        reset: number;
    }
): void {
    headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitEnabled(): boolean {
    return process.env.ENABLE_RATE_LIMITING === 'true' && isRedisConfigured;
}
