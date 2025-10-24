// Rate Limiting Middleware
// Protects against brute force attacks and API abuse

import { logSecurityEvent, SECURITY_EVENTS } from "../utils/securityLogger.js";

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map();
const blockedIPs = new Set();

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: "Too many requests, please try again later.",
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // attempts per window
    message: "Too many login attempts, please try again later.",
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // attempts per window
    message: "Too many password reset attempts, please try again later.",
  },
};

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(type = "general") {
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.general;

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const key = `${type}_${ip}`;
    const now = Date.now();

    // Check if IP is blocked
    if (blockedIPs.has(ip)) {
      logSecurityEvent(
        SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        {
          ip,
          reason: "IP blocked due to rate limiting",
          endpoint: req.originalUrl,
        },
        req
      );

      return res.status(429).json({
        error: "IP temporarily blocked due to suspicious activity",
      });
    }

    // Get or create request count record
    if (!requestCounts.has(key)) {
      requestCounts.set(key, {
        count: 0,
        resetTime: now + config.windowMs,
      });
    }

    const record = requestCounts.get(key);

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
        setTimeout(() => {
          blockedIPs.delete(ip);
        }, 60 * 60 * 1000); // Block for 1 hour
      }

      return res.status(429).json({
        error: config.message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    // Add rate limit headers
    res.set({
      "X-RateLimit-Limit": config.max,
      "X-RateLimit-Remaining": Math.max(0, config.max - record.count),
      "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
    });

    next();
  };
}

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

// Export pre-configured rate limiters
export const generalRateLimit = createRateLimiter("general");
export const authRateLimit = createRateLimiter("auth");
export const passwordResetRateLimit = createRateLimiter("passwordReset");
