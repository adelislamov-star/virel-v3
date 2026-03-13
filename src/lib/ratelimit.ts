import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Graceful degradation: if Upstash env vars are not set, skip rate limiting
function createLoginRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: false,
    prefix: 'virel:login',
  });
}

export const loginRatelimit = createLoginRatelimit();
