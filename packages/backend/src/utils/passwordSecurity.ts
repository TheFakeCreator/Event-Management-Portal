// Password Security Utility
// Implements strong password validation and security measures

import bcrypt from 'bcrypt';
import { logSecurityEvent, SECURITY_EVENTS } from './securityLogger.js';

/**
 * Password requirements configuration
 */
export const PASSWORD_CONFIG = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  saltRounds: 12,

  // Common weak passwords to reject
  commonPasswords: [
    'password',
    'password123',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    '1234567890',
    'iloveyou',
    'sunshine',
    'princess',
    'admin123',
  ] as const,
} as const;

interface PasswordValidationError {
  field: string;
  message: string;
}

interface PasswordValidationResult {
  isValid: boolean;
  errors: PasswordValidationError[];
  strength: 'weak' | 'medium' | 'strong';
}

interface SecurityContext {
  ip?: string;
  userAgent?: string;
  userId?: string;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(
  password: string
): PasswordValidationResult {
  const errors: PasswordValidationError[] = [];

  // Check length
  if (!password || password.length < PASSWORD_CONFIG.minLength) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`,
    });
  }

  if (password && password.length > PASSWORD_CONFIG.maxLength) {
    errors.push({
      field: 'password',
      message: `Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`,
    });
  }

  // Check character requirements
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
    });
  }

  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
    });
  }

  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
    });
  }

  if (
    PASSWORD_CONFIG.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one special character',
    });
  }

  // Check against common passwords
  if (
    PASSWORD_CONFIG.commonPasswords.some(
      (common) => common === password.toLowerCase()
    )
  ) {
    errors.push({
      field: 'password',
      message: 'Password is too common. Please choose a more secure password',
    });
  }

  // Check for patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password should not contain repeated characters',
    });
  }

  // Sequential characters check
  if (
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(
      password
    )
  ) {
    errors.push({
      field: 'password',
      message: 'Password should not contain sequential characters',
    });
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    const strengthScore = calculatePasswordStrength(password);
    if (strengthScore >= 80) strength = 'strong';
    else if (strengthScore >= 60) strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordStrength(password: string): number {
  let score = 0;

  // Length bonus
  score += Math.min(password.length * 2, 20);

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Length bonus for very long passwords
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Uniqueness bonus
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 2, 15);

  return Math.min(score, 100);
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(
  password: string,
  context?: SecurityContext
): Promise<string> {
  try {
    // Validate password first
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(
        `Password validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
      );
    }

    // Log password hash attempt (for security monitoring)
    if (context) {
      logSecurityEvent(
        SECURITY_EVENTS.PASSWORD_HASH_ATTEMPT,
        {
          userId: context.userId,
          strength: validation.strength,
        },
        context as any
      );
    }

    const hash = await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds);

    // Log successful hash
    if (context) {
      logSecurityEvent(
        SECURITY_EVENTS.PASSWORD_HASH_SUCCESS,
        {
          userId: context.userId,
          strength: validation.strength,
        },
        context as any
      );
    }

    return hash;
  } catch (error) {
    // Log hash failure
    if (context) {
      logSecurityEvent(
        SECURITY_EVENTS.PASSWORD_HASH_FAILURE,
        {
          userId: context.userId,
          error: (error as Error).message,
        },
        context as any
      );
    }
    throw error;
  }
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string,
  context?: SecurityContext
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);

    // Log comparison attempt
    if (context) {
      logSecurityEvent(
        isMatch
          ? SECURITY_EVENTS.PASSWORD_VERIFY_SUCCESS
          : SECURITY_EVENTS.PASSWORD_VERIFY_FAILURE,
        {
          userId: context.userId,
          success: isMatch,
        },
        context as any
      );
    }

    return isMatch;
  } catch (error) {
    // Log comparison error
    if (context) {
      logSecurityEvent(
        SECURITY_EVENTS.PASSWORD_VERIFY_FAILURE,
        {
          userId: context.userId,
          error: (error as Error).message,
        },
        context as any
      );
    }
    throw error;
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

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
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password has been compromised (basic implementation)
 */
export function isPasswordCompromised(password: string): boolean {
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

/**
 * Get password policy requirements for display
 */
export function getPasswordRequirements(): string[] {
  const requirements: string[] = [];

  requirements.push(`At least ${PASSWORD_CONFIG.minLength} characters long`);

  if (PASSWORD_CONFIG.requireUppercase) {
    requirements.push('At least one uppercase letter (A-Z)');
  }

  if (PASSWORD_CONFIG.requireLowercase) {
    requirements.push('At least one lowercase letter (a-z)');
  }

  if (PASSWORD_CONFIG.requireNumbers) {
    requirements.push('At least one number (0-9)');
  }

  if (PASSWORD_CONFIG.requireSpecialChars) {
    requirements.push('At least one special character (!@#$%^&*...)');
  }

  requirements.push('No common or easily guessed passwords');
  requirements.push('No repeated or sequential characters');

  return requirements;
}
