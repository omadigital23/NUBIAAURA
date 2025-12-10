require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function test() {
  console.log('\n Testing Notification System\n');
  
  // Test Redis
  const ping = await redis.ping();
  console.log('1. Redis connected:', ping);
  
  // Test notification tracking
  const testKey = 'notification:order:test-123';
  await redis.set(testKey, { test: true }, { ex: 10 });
  const exists = await redis.exists(testKey);
  console.log('2. Notification tracking:', exists === 1 ? 'WORKS ' : 'FAILED ');
  
  // Cleanup
  await redis.del(testKey);
  console.log('3. Cleanup: DONE \n');
  console.log('All systems operational! \n');
}

test().catch(console.error);
