// JWT Token Management Utility
import jwt from "jsonwebtoken";
import tokenBlacklist from "./tokenBlacklist.js";

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "1h",
  REFRESH_TOKEN_EXPIRY: "7d",
  ISSUER: "event-portal",
  AUDIENCE: "event-portal-users",
};

/**
 * Generate access token
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role || "user",
      type: "access",
    },
    process.env.JWT_SECRET,
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
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user._id,
      type: "refresh",
    },
    process.env.JWT_SECRET,
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
export function generateVerificationToken(user) {
  return jwt.sign(
    {
      id: user._id,
      type: "verification",
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: TOKEN_CONFIG.ISSUER,
      audience: TOKEN_CONFIG.AUDIENCE,
    }
  );
}

/**
 * Verify token with enhanced validation
 */
export function verifyToken(token, expectedType = null) {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      throw new Error("Token is blacklisted");
    }

    let decoded;

    try {
      // Try with full validation first (for new tokens)
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: TOKEN_CONFIG.ISSUER,
        audience: TOKEN_CONFIG.AUDIENCE,
      });
    } catch (error) {
      // If audience/issuer validation fails, try without for backward compatibility
      if (
        error.message.includes("audience") ||
        error.message.includes("issuer")
      ) {
        console.warn("🔄 Using backward compatible token verification");
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } else {
        throw error;
      }
    } // Verify token type if specified (flexible for backward compatibility)
    if (expectedType && decoded.type && decoded.type !== expectedType) {
      throw new Error(
        `Invalid token type. Expected: ${expectedType}, Got: ${decoded.type}`
      );
    }

    return decoded;
  } catch (error) {
    throw error;
  }
}

/**
 * Blacklist a token
 */
export function blacklistToken(token) {
  try {
    const decoded = jwt.decode(token);
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
export function getSecureCookieOptions(maxAge = 60 * 60 * 1000) {
  // Default 1 hour
  return {
    httpOnly: true, // Prevent XSS
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: maxAge,
  };
}

/**
 * Get options for clearing cookies (removes maxAge to avoid deprecation warning)
 */
export function getClearCookieOptions() {
  return {
    httpOnly: true, // Prevent XSS
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    // Note: maxAge is omitted for clearing cookies to avoid deprecation warning
  };
}

export { TOKEN_CONFIG };
