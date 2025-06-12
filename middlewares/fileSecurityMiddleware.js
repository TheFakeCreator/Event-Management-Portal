/**
 * Enhanced File Upload Security Middleware
 * Provides additional security layers for file uploads beyond basic multer validation
 */

import { logSecurityEvent, SECURITY_EVENTS } from "../utils/securityLogger.js";
import crypto from "crypto";
import path from "path";

// File upload rate limiting (in-memory store for demo - use Redis in production)
const uploadAttempts = new Map();
const UPLOAD_RATE_LIMIT = 10; // 10 uploads per hour per IP
const UPLOAD_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * File signature validation
 * Validates actual file content against MIME type to prevent MIME type spoofing
 */
const validateFileSignature = (buffer, mimeType) => {
  const signatures = {
    "image/jpeg": [
      [0xff, 0xd8, 0xff, 0xe0],
      [0xff, 0xd8, 0xff, 0xe1],
      [0xff, 0xd8, 0xff, 0xe8],
      [0xff, 0xd8, 0xff, 0xdb],
    ],
    "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    "image/gif": [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    ],
    "image/webp": [
      [0x52, 0x49, 0x46, 0x46],
      [0x57, 0x45, 0x42, 0x50],
    ],
  };

  if (!signatures[mimeType]) {
    return false;
  }

  return signatures[mimeType].some((signature) => {
    if (signature.length > buffer.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });
};

/**
 * Simulated virus scanning
 * In production, integrate with actual antivirus solutions like ClamAV
 */
const simulateVirusScan = async (file) => {
  // Simulate scanning delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Check for suspicious patterns in filename
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
    /script/i,
    /virus/i,
    /malware/i,
  ];

  const isSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(file.originalname)
  );

  if (isSuspicious) {
    throw new Error("File rejected by virus scanner");
  }

  return true;
};

/**
 * Rate limiting for file uploads
 */
export const fileUploadRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Clean up old entries
  for (const [ip, data] of uploadAttempts.entries()) {
    if (now - data.firstAttempt > UPLOAD_WINDOW) {
      uploadAttempts.delete(ip);
    }
  }

  // Check current IP
  if (!uploadAttempts.has(clientIP)) {
    uploadAttempts.set(clientIP, {
      count: 1,
      firstAttempt: now,
    });
  } else {
    const data = uploadAttempts.get(clientIP);

    if (now - data.firstAttempt > UPLOAD_WINDOW) {
      // Reset window
      uploadAttempts.set(clientIP, {
        count: 1,
        firstAttempt: now,
      });
    } else {
      data.count++;

      if (data.count > UPLOAD_RATE_LIMIT) {
        logSecurityEvent(
          SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
          {
            ip: clientIP,
            attempts: data.count,
            limit: UPLOAD_RATE_LIMIT,
            window: UPLOAD_WINDOW,
          },
          req
        );

        return res.status(429).json({
          error: "Too many file uploads. Please try again later.",
          retryAfter: Math.ceil(
            (UPLOAD_WINDOW - (now - data.firstAttempt)) / 1000
          ),
        });
      }
    }
  }

  next();
};

/**
 * Enhanced file security validation middleware
 */
export const enhancedFileValidation = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const file = req.file;

    // 1. File signature validation (prevents MIME type spoofing)
    if (file.buffer && !validateFileSignature(file.buffer, file.mimetype)) {
      logSecurityEvent(
        SECURITY_EVENTS.INVALID_FILE_SIGNATURE,
        {
          filename: file.originalname,
          mimetype: file.mimetype,
          detectedSignature: Array.from(file.buffer.slice(0, 8)),
        },
        req
      );

      req.flash(
        "error",
        "File signature does not match declared type. Upload rejected for security."
      );
      return res.redirect("back");
    }

    // 2. Filename sanitization and validation
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 100); // Limit filename length

    if (sanitizedName !== file.originalname) {
      logSecurityEvent(
        SECURITY_EVENTS.FILENAME_SANITIZED,
        {
          original: file.originalname,
          sanitized: sanitizedName,
        },
        req
      );
    }

    // 3. Virus scanning simulation
    try {
      await simulateVirusScan(file);
    } catch (scanError) {
      logSecurityEvent(
        SECURITY_EVENTS.VIRUS_DETECTED,
        {
          filename: file.originalname,
          error: scanError.message,
        },
        req
      );

      req.flash("error", "File upload rejected by security scanner.");
      return res.redirect("back");
    }

    // 4. Generate file hash for integrity checking
    const fileHash = crypto
      .createHash("sha256")
      .update(file.buffer || file.path)
      .digest("hex");

    // Store hash in file metadata for later verification
    file.securityHash = fileHash;

    // 5. Content-based validation for images
    if (file.mimetype.startsWith("image/")) {
      // Additional image-specific validations can be added here
      // e.g., check for embedded scripts, validate image dimensions, etc.
    }

    // Log successful security validation
    logSecurityEvent(
      SECURITY_EVENTS.FILE_SECURITY_VALIDATED,
      {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hash: fileHash,
      },
      req
    );

    next();
  } catch (error) {
    logSecurityEvent(
      SECURITY_EVENTS.FILE_VALIDATION_ERROR,
      {
        error: error.message,
        filename: req.file?.originalname,
      },
      req
    );

    req.flash("error", "File validation failed. Please try again.");
    return res.redirect("back");
  }
};

/**
 * Secure file upload error handler
 */
export const fileUploadErrorHandler = (error, req, res, next) => {
  // Handle multer-specific errors
  if (error.code === "LIMIT_FILE_SIZE") {
    logSecurityEvent(
      SECURITY_EVENTS.FILE_TOO_LARGE,
      {
        filename: req.file?.originalname,
        size: req.file?.size,
        limit: error.limit,
      },
      req
    );

    req.flash("error", "File too large. Maximum size allowed is 5MB.");
    return res.redirect("back");
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    logSecurityEvent(
      SECURITY_EVENTS.TOO_MANY_FILES,
      {
        count: error.field,
      },
      req
    );

    req.flash("error", "Too many files. Only one file allowed per upload.");
    return res.redirect("back");
  }

  if (
    error.code === "INVALID_FILE_TYPE" ||
    error.code === "INVALID_FILE_EXTENSION"
  ) {
    logSecurityEvent(
      SECURITY_EVENTS.INVALID_FILE_UPLOAD,
      {
        filename: req.file?.originalname,
        error: error.message,
      },
      req
    );

    req.flash("error", error.message);
    return res.redirect("back");
  }

  if (error.code === "INVALID_FILENAME") {
    logSecurityEvent(
      SECURITY_EVENTS.INVALID_FILENAME,
      {
        filename: req.file?.originalname,
        error: error.message,
      },
      req
    );

    req.flash("error", error.message);
    return res.redirect("back");
  }

  // Handle other file upload errors
  logSecurityEvent(
    SECURITY_EVENTS.FILE_UPLOAD_ERROR,
    {
      error: error.message,
      code: error.code,
      filename: req.file?.originalname,
    },
    req
  );

  req.flash("error", "File upload failed. Please try again.");
  return res.redirect("back");
};

/**
 * Comprehensive file security middleware stack
 * Combines rate limiting, enhanced validation, and error handling
 */
export const secureFileUpload = [
  fileUploadRateLimit,
  enhancedFileValidation,
  fileUploadErrorHandler,
];

export default {
  fileUploadRateLimit,
  enhancedFileValidation,
  fileUploadErrorHandler,
  secureFileUpload,
};
