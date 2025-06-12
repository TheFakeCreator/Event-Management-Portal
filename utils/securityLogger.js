// Security Audit Logger
// Logs security-related events for monitoring and analysis

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const securityLogFile = path.join(logsDir, "security.log");

/**
 * Log security events
 */
export function logSecurityEvent(eventType, details, req = null) {
  const timestamp = new Date().toISOString();
  const ip = req
    ? req.ip || req.connection?.remoteAddress || "unknown"
    : "system";
  const userAgent = req ? req.get("User-Agent") || "unknown" : "system";
  const userId = req?.user?.id || "anonymous";

  const logEntry = {
    timestamp,
    eventType,
    userId,
    ip,
    userAgent,
    details,
    severity: getSeverity(eventType),
  };

  // Write to file (in production, consider using a proper logging library like Winston)
  const logLine = JSON.stringify(logEntry) + "\n";

  try {
    fs.appendFileSync(securityLogFile, logLine);

    // Also log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `🔒 Security Event [${logEntry.severity}]:`,
        eventType,
        details
      );
    }

    // Alert on critical events
    if (logEntry.severity === "CRITICAL") {
      console.error(`🚨 CRITICAL SECURITY EVENT: ${eventType}`, details);
      // In production, send alerts via email/SMS/Slack etc.
    }
  } catch (error) {
    console.error("Failed to write security log:", error);
  }
}

/**
 * Get severity level for event type
 */
function getSeverity(eventType) {
  const criticalEvents = [
    "MULTIPLE_FAILED_LOGINS",
    "SUSPICIOUS_TOKEN_USAGE",
    "ACCOUNT_TAKEOVER_ATTEMPT",
    "PRIVILEGE_ESCALATION_ATTEMPT",
    "XSS_ATTEMPT",
    "NOSQL_INJECTION_ATTEMPT",
    "SANITIZATION_ERROR",
    "VIRUS_DETECTED",
    "INVALID_FILE_SIGNATURE",
  ];

  const highEvents = [
    "FAILED_LOGIN",
    "INVALID_TOKEN",
    "UNAUTHORIZED_ACCESS_ATTEMPT",
    "PASSWORD_RESET_REQUEST",
    "VALIDATION_FAILED",
    "INVALID_FILE_UPLOAD",
    "FILE_TOO_LARGE",
    "RATE_LIMIT_EXCEEDED",
    "TOO_MANY_FILES",
    "INVALID_FILENAME",
    "FILE_UPLOAD_ERROR",
  ];
  const mediumEvents = [
    "SUCCESSFUL_LOGIN",
    "LOGOUT",
    "PASSWORD_CHANGE",
    "EMAIL_VERIFICATION",
    "VALIDATION_ERROR",
    "SENSITIVE_OPERATION",
    "EMAIL_FAILED",
    "FILE_UPLOAD_VALIDATED",
    "FILE_SECURITY_VALIDATED",
    "FILENAME_SANITIZED",
    "FILE_VALIDATION_ERROR",
  ];

  if (criticalEvents.includes(eventType)) return "CRITICAL";
  if (highEvents.includes(eventType)) return "HIGH";
  if (mediumEvents.includes(eventType)) return "MEDIUM";
  return "LOW";
}

/**
 * Security event types
 */
export const SECURITY_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: "SUCCESSFUL_LOGIN",
  LOGIN_FAILED: "FAILED_LOGIN",
  LOGOUT: "LOGOUT",

  // Token events
  TOKEN_INVALID: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_BLACKLISTED: "TOKEN_BLACKLISTED",

  // Suspicious activities
  MULTIPLE_FAILED_LOGINS: "MULTIPLE_FAILED_LOGINS",
  SUSPICIOUS_TOKEN: "SUSPICIOUS_TOKEN_USAGE",

  // Account events
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  ACCOUNT_VERIFIED: "EMAIL_VERIFICATION",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  PASSWORD_CHANGED: "PASSWORD_CHANGE",
  EMAIL_FAILED: "EMAIL_FAILED",

  // Access control
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS_ATTEMPT",
  PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_ATTEMPT",
  // Input validation and injection prevention
  VALIDATION_FAILED: "VALIDATION_FAILED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  XSS_ATTEMPT: "XSS_ATTEMPT",
  NOSQL_INJECTION_ATTEMPT: "NOSQL_INJECTION_ATTEMPT",
  SANITIZATION_ERROR: "SANITIZATION_ERROR",

  // CSRF Protection
  CSRF_ATTEMPT: "CSRF_ATTEMPT",
  SUSPICIOUS_REFERER: "SUSPICIOUS_REFERER",
  ADMIN_OPERATION: "ADMIN_OPERATION",

  // File upload security
  INVALID_FILE_UPLOAD: "INVALID_FILE_UPLOAD",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_UPLOAD_VALIDATED: "FILE_UPLOAD_VALIDATED",
  FILE_SECURITY_VALIDATED: "FILE_SECURITY_VALIDATED",
  INVALID_FILE_SIGNATURE: "INVALID_FILE_SIGNATURE",
  VIRUS_DETECTED: "VIRUS_DETECTED",
  FILENAME_SANITIZED: "FILENAME_SANITIZED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  TOO_MANY_FILES: "TOO_MANY_FILES",
  INVALID_FILENAME: "INVALID_FILENAME",
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
  FILE_VALIDATION_ERROR: "FILE_VALIDATION_ERROR",

  // Sensitive operations
  SENSITIVE_OPERATION: "SENSITIVE_OPERATION",
};

/**
 * Rate limiting tracking
 */
const failedAttempts = new Map();

export function trackFailedLogin(ip) {
  const key = `login_${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, []);
  }

  const attempts = failedAttempts.get(key);

  // Remove attempts outside the window
  const validAttempts = attempts.filter((time) => now - time < windowMs);
  validAttempts.push(now);

  failedAttempts.set(key, validAttempts);

  // Check if we should alert
  if (validAttempts.length >= 5) {
    logSecurityEvent(SECURITY_EVENTS.MULTIPLE_FAILED_LOGINS, {
      ip,
      attempts: validAttempts.length,
      timeWindow: "15 minutes",
    });
  }

  return validAttempts.length;
}

export function clearFailedAttempts(ip) {
  const key = `login_${ip}`;
  failedAttempts.delete(key);
}
