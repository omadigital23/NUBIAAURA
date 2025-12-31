import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a new ratelimiter that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// Stricter limit for auth endpoints (5 requests per minute)
export const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});

// Payment endpoints limit (10 requests per minute - more lenient for retries)
export const paymentRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

// Form submission limit (2 requests per minute)
export const formRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, '1 m'),
});

export async function checkRateLimit(identifier: string, limiter: Ratelimit) {
  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    return {
      success,
      limit,
      reset,
      remaining,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow request if rate limit service fails
    return {
      success: true,
      limit: 10,
      reset: Date.now() + 10000,
      remaining: 10,
    };
  }
}
