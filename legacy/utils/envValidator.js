// Environment Variable Validation Utility
// Ensures all required environment variables are present and secure

import crypto from "crypto";

const requiredEnvVars = [
  "JWT_SECRET",
  "SESSION_SECRET",
  "MONGO_URI", // Fixed to match actual env var name
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
];

export function validateEnvironment() {
  const missingVars = [];
  const weakSecrets = [];

  // Check for missing variables
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  // Validate JWT_SECRET strength (should be at least 256 bits / 32 bytes)
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret.length < 32) {
    weakSecrets.push("JWT_SECRET (minimum 32 characters required)");
  }

  // Validate SESSION_SECRET strength
  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret && sessionSecret.length < 32) {
    weakSecrets.push("SESSION_SECRET (minimum 32 characters required)");
  }

  if (weakSecrets.length > 0) {
    console.warn(`⚠️  Weak secrets detected: ${weakSecrets.join(", ")}`);
    console.warn(
      "Consider using cryptographically secure random strings for production."
    );
  }

  console.log("✅ Environment variables validated successfully");
}

// Generate secure random secret (for reference)
export function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

// Example usage:
// console.log('Generated JWT_SECRET:', generateSecureSecret());
// console.log('Generated SESSION_SECRET:', generateSecureSecret());
