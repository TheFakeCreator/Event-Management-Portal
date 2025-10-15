// Token Blacklist Utility
// This provides a simple in-memory token blacklist for development
// In production, consider using Redis or database storage

interface BlacklistedTokenEntry {
  token: string;
  expiresAt: number;
}

class TokenBlacklist {
  private blacklistedTokens: Set<BlacklistedTokenEntry>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.blacklistedTokens = new Set();
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      60 * 60 * 1000
    ); // Cleanup every hour
  }

  /**
   * Add token to blacklist
   */
  addToken(token: string, expiresAt?: number): void {
    this.blacklistedTokens.add({
      token,
      expiresAt: expiresAt || Date.now() + 60 * 60 * 1000, // Default 1 hour
    });
  }

  /**
   * Check if token is blacklisted
   */
  isBlacklisted(token: string): boolean {
    for (const entry of this.blacklistedTokens) {
      if (entry.token === token) {
        return true;
      }
    }
    return false;
  }

  /**
   * Remove expired tokens from blacklist
   */
  private cleanup(): void {
    const now = Date.now();
    for (const entry of this.blacklistedTokens) {
      if (entry.expiresAt < now) {
        this.blacklistedTokens.delete(entry);
      }
    }
  }

  /**
   * Get current number of blacklisted tokens
   */
  size(): number {
    return this.blacklistedTokens.size;
  }

  /**
   * Clear all blacklisted tokens
   */
  clear(): void {
    this.blacklistedTokens.clear();
  }

  /**
   * Destroy the blacklist (cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.blacklistedTokens.clear();
  }
}

// Create singleton instance
const tokenBlacklist = new TokenBlacklist();

export default tokenBlacklist;
