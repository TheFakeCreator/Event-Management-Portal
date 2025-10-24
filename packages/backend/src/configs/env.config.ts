import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from multiple possible locations
dotenv.config(); // First try default .env in project root
dotenv.config({ path: path.join(process.cwd(), '.env') }); // Try current working directory
dotenv.config({
  path: path.join(process.cwd(), 'packages', 'backend', '.env'),
}); // Try backend specific

// Environment variable schema using Zod
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default('3000'),

  // Database
  DATABASE_URL: z.string().url().optional(),
  DB_NAME: z.string().min(1).default('event-management'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Session
  SESSION_SECRET: z.string().min(32),

  // Email
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().transform(Number).pipe(z.number()).optional(),
  EMAIL_USER: z.string().email().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(z.number())
    .default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number())
    .default('100'),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  // Client URL for building links in emails
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  // File Upload
  MAX_FILE_SIZE: z
    .string()
    .transform(Number)
    .pipe(z.number())
    .default('5242880'),

  // Security
  BCRYPT_ROUNDS: z
    .string()
    .transform(Number)
    .pipe(z.number().min(10).max(15))
    .default('12'),
  MAX_LOGIN_ATTEMPTS: z
    .string()
    .transform(Number)
    .pipe(z.number())
    .default('5'),
  ACCOUNT_LOCK_TIME: z
    .string()
    .transform(Number)
    .pipe(z.number())
    .default('900000'),
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * @returns Validated environment configuration
 * @throws Error if validation fails
 */
export function validateEnvironment(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 */
export const env = validateEnvironment();

/**
 * Check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if we're in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';
