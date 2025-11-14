import Redis from 'ioredis';

// Redis client instance
let redisClient: Redis | null = null;

// Cache configuration - Optimized for better hit rates
const CACHE_TTL = {
  PROMPTS_LIST: 900, // 15 minutes (lists change less frequently)
  ARTWORK_LIST: 900, // 15 minutes (lists change less frequently)
  ARTWORK_APPROVED: 0, // No expiration - approved artworks cached permanently
  SINGLE_ITEM: 600, // 10 minutes (individual items are accessed frequently)
  SITE_CONTENT: 7200, // 2 hours (rarely changes)
  NEXT_NUMBER: 1800, // 30 minutes (changes incrementally)
  PERMANENT: 0, // 0 means no expiration in Redis
};

// Cache key patterns
export const CACHE_KEYS = {
  // Lists
  PROMPTS_ALL: 'prompts:all',
  PROMPTS_PENDING: 'prompts:pending',
  PROMPTS_COMPLETED: 'prompts:completed',
  ARTWORKS_ALL: 'artworks:all',
  ARTWORKS_APPROVED: 'artworks:approved',
  ARTWORKS_PENDING: 'artworks:pending',

  // Single items
  PROMPT: (id: string) => `prompt:${id}`,
  ARTWORK: (id: string) => `artwork:${id}`,

  // Computed values
  NEXT_PROMPT_NUMBER: 'prompts:nextNumber',
  NEXT_ARTWORK_NUMBER: 'artworks:nextNumber',

  // Site content
  SITE_CONTENT: 'site:content',

  // Statistics
  STATS_PROMPTS: 'stats:prompts',
  STATS_ARTWORKS: 'stats:artworks',
};

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  // Use environment variable for Redis URL, fallback to localhost for development
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      // Stop retrying after 3 attempts in production
      if (times > 3) {
        console.warn('⚠️  Redis connection failed after 3 retries, continuing without cache');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: true, // Don't connect immediately, allow app to start
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    console.warn('⚠️  Redis connection error (app will continue without cache):', err.message);
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis is ready to accept commands');
  });

  // Try to connect, but don't block app startup if it fails
  redisClient.connect().catch((err) => {
    console.warn('⚠️  Failed to connect to Redis on startup:', err.message);
    console.log('ℹ️  Application will continue without Redis caching');
  });

  return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedis(): Redis {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

/**
 * Generic cache get operation
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const cached = await redis.get(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Generic cache set operation with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<void> {
  try {
    const redis = getRedis();
    const serialized = JSON.stringify(value);

    if (ttl && ttl > 0) {
      // Set with expiration if TTL is provided and greater than 0
      await redis.setex(key, ttl, serialized);
    } else {
      // Set without expiration (permanent) if TTL is 0 or undefined
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Delete specific cache keys
 */
export async function cacheDel(keys: string | string[]): Promise<void> {
  try {
    const redis = getRedis();
    const keysArray = Array.isArray(keys) ? keys : [keys];

    if (keysArray.length > 0) {
      await redis.del(...keysArray);
    }
  } catch (error) {
    console.error(`Cache delete error for keys ${keys}:`, error);
  }
}

/**
 * Delete cache keys by pattern
 */
export async function cacheDelByPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Cache delete by pattern error for ${pattern}:`, error);
  }
}

/**
 * Invalidate all prompt-related caches
 */
export async function invalidatePromptsCache(): Promise<void> {
  await cacheDel([
    CACHE_KEYS.PROMPTS_ALL,
    CACHE_KEYS.PROMPTS_PENDING,
    CACHE_KEYS.PROMPTS_COMPLETED,
    CACHE_KEYS.NEXT_PROMPT_NUMBER,
    CACHE_KEYS.STATS_PROMPTS,
  ]);

  // Also clear individual prompt caches
  await cacheDelByPattern('prompt:*');
}

/**
 * Invalidate all artwork-related caches
 */
export async function invalidateArtworksCache(): Promise<void> {
  await cacheDel([
    CACHE_KEYS.ARTWORKS_ALL,
    CACHE_KEYS.ARTWORKS_APPROVED,
    CACHE_KEYS.ARTWORKS_PENDING,
    CACHE_KEYS.NEXT_ARTWORK_NUMBER,
    CACHE_KEYS.STATS_ARTWORKS,
  ]);

  // Also clear individual artwork caches
  await cacheDelByPattern('artwork:*');
}

/**
 * Invalidate site content cache
 */
export async function invalidateSiteContentCache(): Promise<void> {
  await cacheDel(CACHE_KEYS.SITE_CONTENT);
}

/**
 * Clear all caches
 */
export async function clearAllCache(): Promise<void> {
  try {
    const redis = getRedis();
    await redis.flushdb();
    console.log('✅ All cache cleared');
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Cache wrapper for database queries
 * Implements read-through caching pattern
 */
export async function cacheWrapper<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    console.log(`✅ Cache hit for ${key}`);
    return cached;
  }

  // Cache miss - fetch from database
  console.log(`❌ Cache miss for ${key}`);
  const data = await fetchFunction();

  // Store in cache for next time
  await cacheSet(key, data, ttl);

  return data;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  memoryUsage: string;
  connected: boolean;
}> {
  try {
    const redis = getRedis();
    const info = await redis.info('memory');
    const dbSize = await redis.dbsize();

    // Extract memory usage from info
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';

    return {
      totalKeys: dbSize,
      memoryUsage,
      connected: redis.status === 'ready',
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalKeys: 0,
      memoryUsage: 'Unknown',
      connected: false,
    };
  }
}

// Export TTL constants for use in other modules
export { CACHE_TTL };

// Graceful shutdown
process.on('SIGINT', async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
});