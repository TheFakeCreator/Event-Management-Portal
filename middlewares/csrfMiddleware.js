/**
 * Custom CSRF Protection Middleware
 * Implements CSRF protection using double-submit cookie pattern
 */

import crypto from "crypto";
import { logSecurityEvent, SECURITY_EVENTS } from "../utils/securityLogger.js";

/**
 * Generate a cryptographically secure CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * CSRF token generation middleware
 * Generates and sets CSRF token for forms
 */
export const generateCSRF = (req, res, next) => {
  // Generate new CSRF token if one doesn't exist
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  // Make token available to templates
  res.locals.csrfToken = req.session.csrfToken;

  // Set CSRF token in cookie for double-submit pattern
  res.cookie("XSRF-TOKEN", req.session.csrfToken, {
    httpOnly: false, // Needs to be accessible to JavaScript for AJAX requests
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60, // 1 hour
  });

  next();
};

/**
 * CSRF token validation middleware
 * Validates CSRF tokens using double-submit cookie pattern
 */
export const validateCSRF = (req, res, next) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints with proper JWT authentication
  if (req.path.startsWith("/api/") && req.headers.authorization) {
    return next();
  }

  const sessionToken = req.session.csrfToken;
  const headerToken =
    req.headers["x-csrf-token"] || req.headers["x-xsrf-token"];
  const bodyToken = req.body._csrf;
  const cookieToken = req.cookies["XSRF-TOKEN"];

  // Get token from various sources
  const clientToken = headerToken || bodyToken || cookieToken;

  // Check if tokens exist and match
  if (!sessionToken || !clientToken || sessionToken !== clientToken) {
    // Log CSRF attempt
    logSecurityEvent(
      SECURITY_EVENTS.CSRF_ATTEMPT,
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        method: req.method,
        referer: req.get("Referer"),
        hasSessionToken: !!sessionToken,
        hasClientToken: !!clientToken,
        tokenMatch: sessionToken === clientToken,
      },
      req
    );

    // Handle CSRF validation failure
    if (
      req.headers["content-type"] &&
      req.headers["content-type"].includes("application/json")
    ) {
      return res.status(403).json({
        error: "Invalid CSRF token",
        code: "CSRF_TOKEN_MISMATCH",
      });
    } else {
      req.flash("error", "Security token validation failed. Please try again.");
      return res.redirect("back");
    }
  }

  next();
};

/**
 * Enhanced CSRF protection for sensitive operations
 */
export const validateSensitiveCSRF = (req, res, next) => {
  // Apply stricter CSRF validation for sensitive operations
  validateCSRF(req, res, (err) => {
    if (err) return next(err);

    // Additional validation for sensitive operations
    const sensitiveOperations = [
      "/admin/",
      "/auth/change-password",
      "/user/delete",
      "/event/delete",
      "/club/delete",
    ];

    const isSensitive = sensitiveOperations.some((path) =>
      req.path.includes(path)
    );

    if (isSensitive) {
      // Log sensitive operation
      logSecurityEvent(
        SECURITY_EVENTS.SENSITIVE_OPERATION,
        {
          operation: req.method + " " + req.path,
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        },
        req
      );

      // Additional validation: check referer for sensitive operations
      const referer = req.get("Referer");
      const host = req.get("Host");

      if (!referer || !referer.includes(host)) {
        logSecurityEvent(
          SECURITY_EVENTS.SUSPICIOUS_REFERER,
          {
            referer,
            host,
            path: req.path,
            ip: req.ip,
          },
          req
        );

        return res.status(403).json({
          error: "Invalid request origin",
          code: "INVALID_REFERER",
        });
      }
    }

    next();
  });
};

/**
 * Middleware to refresh CSRF token
 * Used after successful authentication or sensitive operations
 */
export const refreshCSRF = (req, res, next) => {
  // Generate new CSRF token
  req.session.csrfToken = generateCSRFToken();
  res.locals.csrfToken = req.session.csrfToken;

  // Update cookie
  res.cookie("XSRF-TOKEN", req.session.csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60, // 1 hour
  });

  next();
};

/**
 * Clean up expired CSRF tokens
 */
export const cleanupCSRF = (req, res, next) => {
  // Clear CSRF token on logout
  if (req.path === "/auth/logout") {
    delete req.session.csrfToken;
    res.clearCookie("XSRF-TOKEN");
  }

  next();
};

export default {
  generateCSRF,
  validateCSRF,
  validateSensitiveCSRF,
  refreshCSRF,
  cleanupCSRF,
};
