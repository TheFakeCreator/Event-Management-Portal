/**
 * XSS Protection Utilities
 * Comprehensive XSS prevention for templates and user input
 */

import xss from "xss";
import validator from "validator";

/**
 * XSS filter configuration for different content types
 */
const xssConfig = {
  // Strict config for user input (no HTML allowed)
  strict: {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  },

  // Basic config for simple content (basic formatting only)
  basic: {
    whiteList: {
      b: [],
      i: [],
      em: [],
      strong: [],
      p: [],
      br: [],
      span: ["class"],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  },

  // Rich config for content that needs more formatting (like event descriptions)
  rich: {
    whiteList: {
      b: [],
      i: [],
      em: [],
      strong: [],
      p: ["class"],
      br: [],
      span: ["class"],
      div: ["class"],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      ul: ["class"],
      ol: ["class"],
      li: [],
      a: ["href", "title", "target"],
      img: ["src", "alt", "title", "width", "height"],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "textarea",
      "button",
    ],
    onIgnoreTagAttr: (tag, name, value, isWhiteAttr) => {
      // Remove javascript: urls and event handlers
      if (name === "href" && /^javascript:/i.test(value)) {
        return "";
      }
      if (/^on\w+$/i.test(name)) {
        return "";
      }
      return "";
    },
  },
};

/**
 * Sanitize input for different contexts
 */
export const sanitizeInput = {
  /**
   * Sanitize user input (usernames, names, etc.) - no HTML allowed
   */
  user: (input) => {
    if (!input || typeof input !== "string") return input;
    return xss(input, xssConfig.strict);
  },

  /**
   * Sanitize basic text content - basic formatting allowed
   */
  text: (input) => {
    if (!input || typeof input !== "string") return input;
    return xss(input, xssConfig.basic);
  },

  /**
   * Sanitize rich content - more formatting allowed but still safe
   */
  rich: (input) => {
    if (!input || typeof input !== "string") return input;
    return xss(input, xssConfig.rich);
  },

  /**
   * Sanitize for JSON context - prevent JSON injection
   */
  json: (input) => {
    if (!input || typeof input !== "string") return input;
    // Remove any potential JSON breaking characters
    return input
      .replace(/[\\"]/g, "\\$&")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  },

  /**
   * Sanitize URLs
   */
  url: (input) => {
    if (!input || typeof input !== "string") return input;

    // Only allow http, https, and mailto protocols
    const allowedProtocols = ["http", "https", "mailto"];

    try {
      if (validator.isURL(input, { protocols: allowedProtocols })) {
        return input;
      }
      return "";
    } catch (error) {
      return "";
    }
  },

  /**
   * Sanitize email addresses
   */
  email: (input) => {
    if (!input || typeof input !== "string") return input;

    if (validator.isEmail(input)) {
      return validator.normalizeEmail(input);
    }
    return input; // Return as-is if not a valid email to show validation error
  },
};

/**
 * EJS helper functions for safe output
 */
export const ejsHelpers = {
  /**
   * Safe output for user content
   */
  safeUser: (content) => {
    return sanitizeInput.user(content);
  },

  /**
   * Safe output for text content
   */
  safeText: (content) => {
    return sanitizeInput.text(content);
  },

  /**
   * Safe output for rich content
   */
  safeRich: (content) => {
    return sanitizeInput.rich(content);
  },

  /**
   * Safe JSON stringification for embedding in templates
   */
  safeJSON: (data) => {
    try {
      const jsonString = JSON.stringify(data);
      // Escape any HTML-like content in JSON
      return jsonString
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/'/g, "\\u0027");
    } catch (error) {
      return "{}";
    }
  },

  /**
   * Safe line break replacement
   */
  safeLineBreaks: (content) => {
    if (!content || typeof content !== "string") return "";
    // First sanitize, then replace line breaks
    const sanitized = sanitizeInput.rich(content);
    return sanitized.replace(/\n/g, "<br>");
  },
};

/**
 * Middleware to add XSS protection helpers to response locals
 */
export const addXSSHelpers = (req, res, next) => {
  // Add sanitization helpers to response locals
  res.locals.sanitize = sanitizeInput;
  res.locals.safe = ejsHelpers;

  next();
};

/**
 * Validate and sanitize object recursively
 */
export const sanitizeObject = (obj, level = "basic") => {
  if (!obj || typeof obj !== "object") return obj;

  const sanitizer = sanitizeInput[level] || sanitizeInput.basic;

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === "string") {
        obj[key] = sanitizer(obj[key]);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeObject(obj[key], level);
      }
    }
  }

  return obj;
};

/**
 * Content Security Policy helpers
 */
export const cspHelpers = {
  /**
   * Generate nonce for inline scripts
   */
  generateNonce: () => {
    return Buffer.from(Math.random().toString(36).substr(2, 9)).toString(
      "base64"
    );
  },

  /**
   * CSP configuration for different page types
   */
  getCSPConfig: (pageType = "default") => {
    const baseConfig = {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
      ],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
      ],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    };

    switch (pageType) {
      case "upload":
        baseConfig.connectSrc.push(
          "https://api.cloudinary.com",
          "https://res.cloudinary.com"
        );
        break;
      case "maps":
        baseConfig.scriptSrc.push("https://maps.googleapis.com");
        baseConfig.connectSrc.push("https://maps.googleapis.com");
        break;
      default:
        break;
    }

    return baseConfig;
  },
};

export default {
  sanitizeInput,
  ejsHelpers,
  addXSSHelpers,
  sanitizeObject,
  cspHelpers,
};
