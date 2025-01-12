import { NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

interface RateLimitConfig {
  windowMs: number;  // The time window in milliseconds
  max: number;       // Max number of requests in the time window
}

// Different limits for development and production
const config: RateLimitConfig = {
  windowMs: isDevelopment ? 1000 : 60000,  // 1 second in dev, 1 minute in prod
  max: isDevelopment ? 100 : 30,           // 100 requests/sec in dev, 30 requests/min in prod
};

// In-memory store for rate limiting
// Note: For production, consider using Redis or a similar distributed store
const store = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(userId: string) {
  const now = Date.now();
  const userKey = `${userId}`;
  const userStore = store.get(userKey);

  // Clear expired entries
  if (userStore && now > userStore.resetTime) {
    store.delete(userKey);
  }

  if (!store.has(userKey)) {
    store.set(userKey, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { limited: false };
  }

  const entry = store.get(userKey)!;
  
  if (entry.count >= config.max) {
    return { 
      limited: true,
      response: new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
          }
        }
      )
    };
  }

  entry.count += 1;
  return { limited: false };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, value]) => {
    if (now > value.resetTime) {
      store.delete(key);
    }
  });
}, config.windowMs); 