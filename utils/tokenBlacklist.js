// Token Blacklist Utility
// This provides a simple in-memory token blacklist for development
// In production, consider using Redis or database storage

class TokenBlacklist {
  constructor() {
    this.blacklistedTokens = new Set();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  // Add token to blacklist
  addToken(token, expiresAt) {
    this.blacklistedTokens.add({
      token,
      expiresAt: expiresAt || Date.now() + 60 * 60 * 1000, // Default 1 hour
    });
  }

  // Check if token is blacklisted
  isBlacklisted(token) {
    for (const entry of this.blacklistedTokens) {
      if (entry.token === token) {
        return true;
      }
    }
    return false;
  }

  // Remove expired tokens from blacklist
  cleanup() {
    const now = Date.now();
    for (const entry of this.blacklistedTokens) {
      if (entry.expiresAt < now) {
        this.blacklistedTokens.delete(entry);
      }
    }
  }

  // Destroy the blacklist (cleanup)
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.blacklistedTokens.clear();
  }
}

// Create singleton instance
const tokenBlacklist = new TokenBlacklist();

export default tokenBlacklist;
