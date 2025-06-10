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
  ];

  const highEvents = [
    "FAILED_LOGIN",
    "INVALID_TOKEN",
    "UNAUTHORIZED_ACCESS_ATTEMPT",
    "PASSWORD_RESET_REQUEST",
  ];

  const mediumEvents = [
    "SUCCESSFUL_LOGIN",
    "LOGOUT",
    "PASSWORD_CHANGE",
    "EMAIL_VERIFICATION",
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

  // Access control
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS_ATTEMPT",
  PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_ATTEMPT",
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
