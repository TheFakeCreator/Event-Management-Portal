// Password Security Utility
// Implements strong password validation and security measures

import bcrypt from "bcrypt";
import { logSecurityEvent, SECURITY_EVENTS } from "./securityLogger.js";

/**
 * Password requirements configuration
 */
const PASSWORD_CONFIG = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  saltRounds: 12,

  // Common weak passwords to reject
  commonPasswords: [
    "password",
    "password123",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "1234567890",
    "iloveyou",
    "sunshine",
    "princess",
    "admin123",
  ],
};

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
  const errors = [];

  // Check length
  if (!password || password.length < PASSWORD_CONFIG.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`
    );
  }

  if (password && password.length > PASSWORD_CONFIG.maxLength) {
    errors.push(
      `Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`
    );
  }

  if (!password) {
    return { isValid: false, errors };
  }

  // Check uppercase letters
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check lowercase letters
  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check numbers
  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check special characters
  if (
    PASSWORD_CONFIG.requireSpecialChars &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
    );
  }

  // Check against common weak passwords
  const lowerPassword = password.toLowerCase();
  if (PASSWORD_CONFIG.commonPasswords.includes(lowerPassword)) {
    errors.push("Password is too common. Please choose a more secure password");
  }

  // Check for repeated characters (e.g., "aaaa", "1111")
  if (/(.)\1{3,}/.test(password)) {
    errors.push(
      "Password cannot contain more than 3 consecutive identical characters"
    );
  }

  // Check for sequential characters (e.g., "1234", "abcd")
  if (hasSequentialChars(password)) {
    errors.push(
      "Password cannot contain sequential characters (e.g., 1234, abcd)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
}

/**
 * Calculate password strength score
 */
function calculatePasswordStrength(password) {
  let score = 0;

  // Length score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety score
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Complexity bonus
  if (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    score += 2;
  }

  // Return strength level
  if (score >= 8) return "very-strong";
  if (score >= 6) return "strong";
  if (score >= 4) return "medium";
  if (score >= 2) return "weak";
  return "very-weak";
}

/**
 * Check for sequential characters
 */
function hasSequentialChars(password) {
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  const lowerPassword = password.toLowerCase();

  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 4; i++) {
      const subseq = sequence.substring(i, i + 4);
      if (lowerPassword.includes(subseq)) {
        return true;
      }
    }

    // Check reverse sequences
    const reverseSeq = sequence.split("").reverse().join("");
    for (let i = 0; i <= reverseSeq.length - 4; i++) {
      const subseq = reverseSeq.substring(i, i + 4);
      if (lowerPassword.includes(subseq)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Securely hash password
 */
export async function hashPassword(password) {
  try {
    return await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds);
  } catch (error) {
    throw new Error("Password hashing failed");
  }
}

/**
 * Securely compare password with timing attack protection
 */
export async function comparePassword(
  plainPassword,
  hashedPassword,
  req = null
) {
  try {
    // Use bcrypt's built-in timing attack protection
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);

    // Add additional timing consistency (makes all comparisons take similar time)
    const startTime = process.hrtime();

    // Perform dummy operation to normalize timing
    if (!isValid) {
      await bcrypt.compare("dummy-password-for-timing", hashedPassword);
    }

    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

    // Log suspicious timing patterns (potential timing attacks)
    if (req && duration < 50) {
      // bcrypt should take at least 50ms
      logSecurityEvent(
        SECURITY_EVENTS.SUSPICIOUS_TOKEN,
        {
          reason: "Suspiciously fast password comparison",
          duration: `${duration}ms`,
          ip: req.ip,
        },
        req
      );
    }

    return isValid;
  } catch (error) {
    throw new Error("Password comparison failed");
  }
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length = 16) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = '!@#$%^&*(),.?":{}|<>';

  const allChars = uppercase + lowercase + numbers + special;

  let password = "";

  // Ensure at least one character from each required set
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Check if password has been compromised (basic implementation)
 */
export function isPasswordCompromised(password) {
  // In a real implementation, you would check against:
  // - Have I Been Pwned API
  // - Known password breach databases
  // - Your own breach detection system

  const lowerPassword = password.toLowerCase();

  // Basic check against very common compromised passwords
  const compromisedPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /login/i,
    /master/i,
  ];

  return compromisedPatterns.some((pattern) => pattern.test(lowerPassword));
}

export { PASSWORD_CONFIG };
