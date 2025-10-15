import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent, SECURITY_EVENTS } from '../utils/securityLogger.js';

// Rate limiting types
type RateLimitType = 'general' | 'auth' | 'passwordReset' | 'fileUpload';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map<string, RequestRecord>();
const blockedIPs = new Set<string>();

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG: Record<RateLimitType, RateLimitConfig> = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Too many requests, please try again later.',
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // attempts per window
    message: 'Too many login attempts, please try again later.',
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // attempts per window
    message: 'Too many password reset attempts, please try again later.',
  },

  // File upload
  fileUpload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // uploads per window
    message: 'Too many file upload attempts, please try again later.',
  },
};

/**
 * Get client IP address
 */
const getClientIP = (req: Request): string => {
  return (
    req.ip ||
    req.socket.remoteAddress ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    'unknown'
  );
};

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(type: RateLimitType = 'general') {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.general;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIP(req);
    const key = `${type}_${ip}`;
    const now = Date.now();

    // Check if IP is blocked
    if (blockedIPs.has(ip)) {
      logSecurityEvent(
        SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        {
          ip,
          reason: 'IP blocked due to rate limiting',
          endpoint: req.originalUrl,
        },
        req
      );

      res.status(429).json({
        success: false,
        message: 'IP temporarily blocked due to suspicious activity',
        error: 'Rate limit exceeded',
      });
      return;
    }

    // Get or create request count record
    if (!requestCounts.has(key)) {
      requestCounts.set(key, {
        count: 0,
        resetTime: now + config.windowMs,
      });
    }

    const record = requestCounts.get(key)!;

    // Reset count if window has expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + config.windowMs;
    }

    // Increment request count
    record.count++;

    // Check if limit exceeded
    if (record.count > config.max) {
      // Log security event
      logSecurityEvent(
        SECURITY_EVENTS.MULTIPLE_FAILED_LOGINS,
        {
          ip,
          attempts: record.count,
          endpoint: req.originalUrl,
          timeWindow: `${config.windowMs / 1000} seconds`,
        },
        req
      );

      // Block IP for repeated violations
      if (record.count > config.max * 2) {
        blockedIPs.add(ip);
        setTimeout(
          () => {
            blockedIPs.delete(ip);
          },
          60 * 60 * 1000
        ); // Block for 1 hour
      }

      res.status(429).json({
        success: false,
        message: config.message,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': Math.max(
        0,
        config.max - record.count
      ).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });

    next();
  };
}

/**
 * Enhanced rate limiter with custom configuration
 */
export function createCustomRateLimiter(
  customConfig: Partial<RateLimitConfig>
) {
  const config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded',
    ...customConfig,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIP(req);
    const key = `custom_${ip}`;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, {
        count: 0,
        resetTime: now + config.windowMs,
      });
    }

    const record = requestCounts.get(key)!;

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + config.windowMs;
    }

    record.count++;

    if (record.count > config.max) {
      res.status(429).json({
        success: false,
        message: config.message,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    res.set({
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': Math.max(
        0,
        config.max - record.count
      ).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });

    next();
  };
}

/**
 * Cleanup old entries periodically
 */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(key);
      }
    }
  },
  5 * 60 * 1000
); // Cleanup every 5 minutes

/**
 * Clear rate limit for specific IP (admin function)
 */
export function clearRateLimit(ip: string, type?: RateLimitType): void {
  if (type) {
    const key = `${type}_${ip}`;
    requestCounts.delete(key);
  } else {
    // Clear all rate limits for this IP
    for (const key of requestCounts.keys()) {
      if (key.endsWith(`_${ip}`)) {
        requestCounts.delete(key);
      }
    }
  }

  // Also unblock IP if blocked
  blockedIPs.delete(ip);
}

/**
 * Get rate limit status for IP
 */
export function getRateLimitStatus(
  ip: string,
  type: RateLimitType = 'general'
): {
  remaining: number;
  resetTime: Date;
  isBlocked: boolean;
} {
  const key = `${type}_${ip}`;
  const config = RATE_LIMIT_CONFIG[type];
  const record = requestCounts.get(key);

  if (!record) {
    return {
      remaining: config.max,
      resetTime: new Date(Date.now() + config.windowMs),
      isBlocked: blockedIPs.has(ip),
    };
  }

  return {
    remaining: Math.max(0, config.max - record.count),
    resetTime: new Date(record.resetTime),
    isBlocked: blockedIPs.has(ip),
  };
}

// Export pre-configured rate limiters
export const generalRateLimit = createRateLimiter('general');
export const authRateLimit = createRateLimiter('auth');
export const passwordResetRateLimit = createRateLimiter('passwordReset');
export const fileUploadRateLimit = createRateLimiter('fileUpload');
