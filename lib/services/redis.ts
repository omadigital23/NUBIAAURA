/**
 * Redis service for caching and preventing duplicate notifications
 * Uses Upstash Redis REST API
 */

import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client with environment variables (only if configured)
const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

/**
 * Check if a notification has already been sent for an order
 * @param orderId - The order ID to check
 * @returns true if notification was already sent, false otherwise
 */
export async function hasNotificationBeenSent(orderId: string): Promise<boolean> {
    if (!redis) {
        console.warn('[Redis] Redis not configured, skipping notification check');
        return false;
    }
    try {
        const key = `notification:order:${orderId}`;
        const exists = await redis.exists(key);
        return exists === 1;
    } catch (error) {
        console.error('[Redis] Error checking notification status:', error);
        // On error, allow notification to be sent (fail open)
        return false;
    }
}

/**
 * Mark a notification as sent for an order
 * @param orderId - The order ID
 * @param ttl - Time to live in seconds (default: 7 days)
 */
export async function markNotificationAsSent(
    orderId: string,
    ttl: number = 604800 // 7 days
): Promise<void> {
    if (!redis) {
        console.warn('[Redis] Redis not configured, skipping notification mark');
        return;
    }
    try {
        const key = `notification:order:${orderId}`;
        await redis.set(key, {
            orderId,
            sentAt: new Date().toISOString(),
            type: 'new_order',
        }, {
            ex: ttl, // Expire after TTL seconds
        });
        console.log(`[Redis] ✅ Marked notification as sent for order: ${orderId}`);
    } catch (error) {
        console.error('[Redis] Error marking notification as sent:', error);
        // Don't throw - notification was sent, just couldn't cache it
    }
}

/**
 * Cache order data for quick retrieval
 * @param orderId - The order ID
 * @param orderData - Order data to cache
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheOrderData(
    orderId: string,
    orderData: any,
    ttl: number = 3600
): Promise<void> {
    if (!redis) {
        console.warn('[Redis] Redis not configured, skipping order cache');
        return;
    }
    try {
        const key = `order:${orderId}`;
        await redis.set(key, orderData, { ex: ttl });
        console.log(`[Redis] ✅ Cached order data: ${orderId}`);
    } catch (error) {
        console.error('[Redis] Error caching order data:', error);
    }
}

/**
 * Get cached order data
 * @param orderId - The order ID
 * @returns Cached order data or null
 */
export async function getCachedOrderData(orderId: string): Promise<any | null> {
    if (!redis) {
        return null;
    }
    try {
        const key = `order:${orderId}`;
        const data = await redis.get(key);
        return data;
    } catch (error) {
        console.error('[Redis] Error getting cached order data:', error);
        return null;
    }
}

/**
 * Clear cached order data
 * @param orderId - The order ID
 */
export async function clearCachedOrderData(orderId: string): Promise<void> {
    if (!redis) {
        return;
    }
    try {
        const key = `order:${orderId}`;
        await redis.del(key);
        console.log(`[Redis] ✅ Cleared cached order data: ${orderId}`);
    } catch (error) {
        console.error('[Redis] Error clearing cached order data:', error);
    }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
    if (!redis) {
        console.warn('[Redis] Redis not configured');
        return false;
    }
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('[Redis] Health check failed:', error);
        return false;
    }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
    return isRedisConfigured && redis !== null;
}

