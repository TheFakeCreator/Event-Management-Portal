import Redis from 'ioredis';
import { createHash } from 'crypto';

// Redis client configuration
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
});

// Handle Redis connection events
redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

redis.on('ready', () => {
    console.log('✅ Redis ready to receive commands');
});

/**
 * Generate cache key based on request details
 */
const generateCacheKey = (req, prefix = 'cache') => {
    const url = req.originalUrl || req.url;
    const method = req.method;
    const userId = req.user?._id?.toString() || 'anonymous';
    const query = JSON.stringify(req.query);

    const keyString = `${prefix}:${method}:${url}:${userId}:${query}`;
    return createHash('md5').update(keyString).digest('hex');
};

/**
 * Cache middleware factory with configurable TTL
 */
export const cache = (options = {}) => {
    const {
        ttl = 300, // 5 minutes default
        prefix = 'api',
        skipCache = false,
        varyBy = [],
        excludeQuery = [],
    } = options;

    return async (req, res, next) => {
        if (skipCache || process.env.NODE_ENV === 'test') {
            return next();
        }

        try {
            // Skip caching for non-GET requests
            if (req.method !== 'GET') {
                return next();
            }

            // Generate cache key
            const cacheKey = generateCacheKey(req, prefix);

            // Try to get cached data
            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                console.log(`📦 Cache hit for key: ${cacheKey}`);
                const parsed = JSON.parse(cachedData);

                // Set cache headers
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`,
                });

                return res.status(parsed.status).json(parsed.data);
            }

            // Cache miss - continue to route handler
            console.log(`🔍 Cache miss for key: ${cacheKey}`);

            // Store original json method
            const originalJson = res.json;

            // Override res.json to cache the response
            res.json = function (data) {
                // Cache the response
                const cacheData = {
                    status: res.statusCode,
                    data: data,
                    timestamp: new Date().toISOString(),
                };

                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redis.setex(cacheKey, ttl, JSON.stringify(cacheData))
                        .then(() => {
                            console.log(`💾 Cached response for key: ${cacheKey}`);
                        })
                        .catch(err => {
                            console.error('❌ Cache set error:', err);
                        });
                }

                // Set cache headers
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`,
                });

                // Call original json method
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('❌ Cache middleware error:', error);
            // Continue without caching on error
            next();
        }
    };
};

/**
 * Cache invalidation patterns
 */
export class CacheInvalidator {
    static async invalidateByPattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                console.log(`🗑️ Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
            }
            return keys.length;
        } catch (error) {
            console.error('❌ Cache invalidation error:', error);
            return 0;
        }
    }

    static async invalidateEvents() {
        return await this.invalidateByPattern('api:GET:*/event*');
    }

    static async invalidateClubs() {
        return await this.invalidateByPattern('api:GET:*/club*');
    }

    static async invalidateUsers() {
        return await this.invalidateByPattern('api:GET:*/user*');
    }

    static async invalidateAll() {
        try {
            await redis.flushdb();
            console.log('🗑️ Cleared all cache');
            return true;
        } catch (error) {
            console.error('❌ Cache flush error:', error);
            return false;
        }
    }

    static async getStats() {
        try {
            const info = await redis.info('memory');
            const keyCount = await redis.dbsize();

            return {
                keyCount,
                memoryUsage: info.match(/used_memory_human:([^\r\n]*)/)?.[1] || 'Unknown',
                connected: redis.status === 'ready',
            };
        } catch (error) {
            console.error('❌ Cache stats error:', error);
            return { error: error.message };
        }
    }
}

/**
 * Specialized caching functions for different data types
 */
export const EventCache = {
    // Cache event list with pagination
    async getEventsList(page = 1, limit = 10, filters = {}) {
        const key = `events:list:${page}:${limit}:${JSON.stringify(filters)}`;
        try {
            const cached = await redis.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('❌ EventCache get error:', error);
            return null;
        }
    },

    async setEventsList(page, limit, filters, data, ttl = 300) {
        const key = `events:list:${page}:${limit}:${JSON.stringify(filters)}`;
        try {
            await redis.setex(key, ttl, JSON.stringify(data));
        } catch (error) {
            console.error('❌ EventCache set error:', error);
        }
    },

    // Cache individual event details
    async getEvent(eventId) {
        const key = `event:${eventId}`;
        try {
            const cached = await redis.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('❌ EventCache get event error:', error);
            return null;
        }
    },

    async setEvent(eventId, data, ttl = 600) {
        const key = `event:${eventId}`;
        try {
            await redis.setex(key, ttl, JSON.stringify(data));
        } catch (error) {
            console.error('❌ EventCache set event error:', error);
        }
    },

    async invalidateEvent(eventId) {
        try {
            await redis.del(`event:${eventId}`);
            await CacheInvalidator.invalidateByPattern('events:list:*');
        } catch (error) {
            console.error('❌ EventCache invalidate error:', error);
        }
    }
};

/**
 * Session-based caching for user-specific data
 */
export const UserSessionCache = {
    async get(userId, key) {
        const fullKey = `user:${userId}:${key}`;
        try {
            const cached = await redis.get(fullKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('❌ UserSessionCache get error:', error);
            return null;
        }
    },

    async set(userId, key, data, ttl = 1800) { // 30 minutes default
        const fullKey = `user:${userId}:${key}`;
        try {
            await redis.setex(fullKey, ttl, JSON.stringify(data));
        } catch (error) {
            console.error('❌ UserSessionCache set error:', error);
        }
    },

    async invalidate(userId, key = '*') {
        try {
            const pattern = `user:${userId}:${key}`;
            await CacheInvalidator.invalidateByPattern(pattern);
        } catch (error) {
            console.error('❌ UserSessionCache invalidate error:', error);
        }
    }
};

/**
 * Rate limiting cache
 */
export const RateLimit = {
    async checkLimit(identifier, maxRequests = 100, windowMs = 60000) {
        const key = `ratelimit:${identifier}`;
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.pexpire(key, windowMs);
            }
            return {
                current,
                remaining: Math.max(0, maxRequests - current),
                resetTime: Date.now() + windowMs,
                exceeded: current > maxRequests
            };
        } catch (error) {
            console.error('❌ RateLimit error:', error);
            return { exceeded: false, current: 0, remaining: maxRequests };
        }
    }
};

export default redis;