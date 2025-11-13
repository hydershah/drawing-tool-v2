/**
 * Performance Monitoring Utility
 * Tracks API endpoint response times and database query performance
 */

import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
}

const performanceData: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 requests in memory

/**
 * Express middleware to track endpoint performance
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const originalSend = res.send;

  // Override the send method to capture timing
  res.send = function(data) {
    const responseTime = Date.now() - start;

    // Log slow queries (over 100ms)
    if (responseTime > 100) {
      console.warn(`⚠️ Slow endpoint: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Store metrics
    const metric: PerformanceMetrics = {
      endpoint: req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date()
    };

    performanceData.push(metric);

    // Keep only last MAX_METRICS entries
    if (performanceData.length > MAX_METRICS) {
      performanceData.shift();
    }

    // Call original send method
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Get performance statistics for monitoring
 */
export function getPerformanceStats() {
  if (performanceData.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowestEndpoints: [],
      recentMetrics: []
    };
  }

  // Calculate average response time
  const totalTime = performanceData.reduce((sum, m) => sum + m.responseTime, 0);
  const averageResponseTime = Math.round(totalTime / performanceData.length);

  // Find slowest endpoints
  const endpointTimes = new Map<string, number[]>();
  performanceData.forEach(m => {
    const key = `${m.method} ${m.endpoint}`;
    if (!endpointTimes.has(key)) {
      endpointTimes.set(key, []);
    }
    endpointTimes.get(key)!.push(m.responseTime);
  });

  const slowestEndpoints = Array.from(endpointTimes.entries())
    .map(([endpoint, times]) => ({
      endpoint,
      averageTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      callCount: times.length
    }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 10);

  // Get recent metrics (last 20)
  const recentMetrics = performanceData.slice(-20).reverse();

  return {
    totalRequests: performanceData.length,
    averageResponseTime,
    slowestEndpoints,
    recentMetrics
  };
}

/**
 * Database query performance wrapper
 */
export async function measureQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - start;

    if (duration > 50) {
      console.warn(`⚠️ Slow query: ${queryName} - ${duration}ms`);
    } else {
      console.log(`✅ Query: ${queryName} - ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed: ${queryName} - ${duration}ms`, error);
    throw error;
  }
}

/**
 * Cache hit rate tracking
 */
let cacheHits = 0;
let cacheMisses = 0;

export function recordCacheHit() {
  cacheHits++;
}

export function recordCacheMiss() {
  cacheMisses++;
}

export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRate: hitRate.toFixed(2) + '%'
  };
}