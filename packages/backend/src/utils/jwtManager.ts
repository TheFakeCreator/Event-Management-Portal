// JWT Token Management Utility
import jwt from 'jsonwebtoken';
import { TokenPayload } from '@event-management/shared';
import tokenBlacklist from './tokenBlacklist.js';

// Type definitions
interface UserTokenData {
  _id: string | { toString(): string };
  role?: string;
  email?: string;
}

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge?: number;
}

// Token configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '1h',
  REFRESH_TOKEN_EXPIRY: '7d',
  VERIFICATION_TOKEN_EXPIRY: '15m',
  ISSUER: 'event-portal',
  AUDIENCE: 'event-portal-users',
} as const;

/**
 * Validates JWT secret exists
 */
const validateJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

/**
 * Convert _id to string if it's an ObjectId
 */
const normalizeUserId = (userId: string | { toString(): string }): string => {
  return typeof userId === 'string' ? userId : userId.toString();
};

/**
 * Generate access token
 */
export function generateAccessToken(user: UserTokenData): string {
  const secret = validateJWTSecret();

  return jwt.sign(
    {
      userId: normalizeUserId(user._id),
      email: user.email || '',
      role: user.role || 'user',
    } as TokenPayload,
    secret,
    {
      expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
      issuer: TOKEN_CONFIG.ISSUER,
      audience: TOKEN_CONFIG.AUDIENCE,
    }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(user: UserTokenData): string {
  const secret = validateJWTSecret();

  return jwt.sign(
    {
      userId: normalizeUserId(user._id),
      email: user.email || '',
      role: user.role || 'user',
    } as TokenPayload,
    secret,
    {
      expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY,
      issuer: TOKEN_CONFIG.ISSUER,
      audience: TOKEN_CONFIG.AUDIENCE,
    }
  );
}

/**
 * Generate verification token
 */
export function generateVerificationToken(user: UserTokenData): string {
  const secret = validateJWTSecret();

  return jwt.sign(
    {
      userId: normalizeUserId(user._id),
      email: user.email || '',
      role: user.role || 'user',
    } as TokenPayload,
    secret,
    {
      expiresIn: TOKEN_CONFIG.VERIFICATION_TOKEN_EXPIRY,
      issuer: TOKEN_CONFIG.ISSUER,
      audience: TOKEN_CONFIG.AUDIENCE,
    }
  );
}

/**
 * Verify token with enhanced validation
 */
export function verifyToken(
  token: string,
  expectedType?: 'access' | 'refresh' | 'verification'
): TokenPayload {
  const secret = validateJWTSecret();

  try {
    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      throw new Error('Token is blacklisted');
    }

    let decoded: TokenPayload;

    try {
      // Try with full validation first (for new tokens)
      decoded = jwt.verify(token, secret, {
        issuer: TOKEN_CONFIG.ISSUER,
        audience: TOKEN_CONFIG.AUDIENCE,
      }) as TokenPayload;
    } catch (error) {
      // If audience/issuer validation fails, try without for backward compatibility
      const errorMessage = (error as Error).message;
      if (
        errorMessage.includes('audience') ||
        errorMessage.includes('issuer')
      ) {
        console.warn('🔄 Using backward compatible token verification');
        decoded = jwt.verify(token, secret) as TokenPayload;
      } else {
        throw error;
      }
    }

    return decoded;
  } catch (error) {
    throw error;
  }
}

/**
 * Blacklist a token
 */
export function blacklistToken(token: string): void {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    if (decoded && decoded.exp) {
      tokenBlacklist.addToken(token, decoded.exp * 1000);
    }
  } catch (error) {
    // If we can't decode, add with default expiry
    tokenBlacklist.addToken(token);
  }
}

/**
 * Set secure cookie options
 */
export function getSecureCookieOptions(
  maxAge: number = 60 * 60 * 1000
): CookieOptions {
  // Default 1 hour
  return {
    httpOnly: true, // Prevent XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge,
  };
}

/**
 * Get options for clearing cookies (removes maxAge to avoid deprecation warning)
 */
export function getClearCookieOptions(): Omit<CookieOptions, 'maxAge'> {
  return {
    httpOnly: true, // Prevent XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    // Note: maxAge is omitted for clearing cookies to avoid deprecation warning
  };
}
