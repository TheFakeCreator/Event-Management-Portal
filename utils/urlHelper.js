// URL Helper Utilities
// Provides dynamic URL generation for different environments

/**
 * Get the base URL for the application based on environment
 * @param {Object} req - Express request object (optional)
 * @returns {string} Base URL
 */
export function getBaseUrl(req = null) {
  // For production, use the production URL
  if (process.env.NODE_ENV === "production") {
    return (
      process.env.PRODUCTION_URL ||
      "https://event-management-portal.onrender.com"
    );
  }

  // For development, try to get from request or use localhost
  if (req) {
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3000";
    return `${protocol}://${host}`;
  }

  // Default for development
  return process.env.BASE_URL || "http://localhost:3000";
}

/**
 * Generate verification URL
 * @param {string} token - Verification token
 * @param {Object} req - Express request object (optional)
 * @returns {string} Complete verification URL
 */
export function generateVerificationUrl(token, req = null) {
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}/auth/verify/${token}`;
}

/**
 * Generate password reset URL
 * @param {string} token - Reset token
 * @param {Object} req - Express request object (optional)
 * @returns {string} Complete password reset URL
 */
export function generatePasswordResetUrl(token, req = null) {
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}/auth/reset-password/${token}`;
}
