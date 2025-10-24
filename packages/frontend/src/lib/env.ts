import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Node.js Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Event Management Portal'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),

  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),

  // Authentication
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // Database
  MONGODB_URI: z.string().min(1),

  // Cloudinary (required for file uploads)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),

  // Upload Configuration
  NEXT_PUBLIC_MAX_FILE_SIZE: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('10485760'),
  NEXT_PUBLIC_ALLOWED_FILE_TYPES: z
    .string()
    .default('image/jpeg,image/png,image/webp,image/gif'),
  NEXT_PUBLIC_MAX_FILES_PER_UPLOAD: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('5'),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Email (optional)
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().transform(Number).pipe(z.number()).optional(),
  EMAIL_SERVER_USER: z.string().email().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Analytics & Monitoring (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_ENABLE_DARK_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  NEXT_PUBLIC_ENABLE_NOTIFICATIONS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  NEXT_PUBLIC_ENABLE_SENTRY: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_ENABLE_PWA: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_MAINTENANCE_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Rate Limiting
  NEXT_PUBLIC_RATE_LIMIT_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('100'),
  NEXT_PUBLIC_RATE_LIMIT_WINDOW: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('900000'),

  // Debug
  NEXT_PUBLIC_DEBUG_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

class EnvironmentError extends Error {
  constructor(
    message: string,
    public issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

let _env: Env | null = null;

export function validateEnvironment(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessage =
      'Invalid environment configuration:\n' +
      result.error.issues
        .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

    throw new EnvironmentError(errorMessage, result.error.issues);
  }

  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    throw new Error(
      'Environment not validated. Call validateEnvironment() first.'
    );
  }
  return _env;
}

// Helper functions for common environment checks
export const env = {
  isDevelopment: () => getEnv().NODE_ENV === 'development',
  isProduction: () => getEnv().NODE_ENV === 'production',
  isTest: () => getEnv().NODE_ENV === 'test',

  // Feature flags
  isAnalyticsEnabled: () => getEnv().NEXT_PUBLIC_ENABLE_ANALYTICS,
  isDarkModeEnabled: () => getEnv().NEXT_PUBLIC_ENABLE_DARK_MODE,
  isNotificationsEnabled: () => getEnv().NEXT_PUBLIC_ENABLE_NOTIFICATIONS,
  isSentryEnabled: () => getEnv().NEXT_PUBLIC_ENABLE_SENTRY,
  isPWAEnabled: () => getEnv().NEXT_PUBLIC_ENABLE_PWA,
  isMaintenanceMode: () => getEnv().NEXT_PUBLIC_MAINTENANCE_MODE,
  isDebugMode: () => getEnv().NEXT_PUBLIC_DEBUG_MODE,

  // Configuration getters
  getApiUrl: () => getEnv().NEXT_PUBLIC_API_URL,
  getAppUrl: () => getEnv().NEXT_PUBLIC_APP_URL,
  getCloudinaryConfig: () => ({
    cloudName: getEnv().NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: getEnv().NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    apiKey: getEnv().NEXT_PUBLIC_CLOUDINARY_API_KEY,
  }),
  getUploadConfig: () => ({
    maxFileSize: getEnv().NEXT_PUBLIC_MAX_FILE_SIZE,
    allowedFileTypes: getEnv()
      .NEXT_PUBLIC_ALLOWED_FILE_TYPES.split(',')
      .map((t) => t.trim()),
    maxFilesPerUpload: getEnv().NEXT_PUBLIC_MAX_FILES_PER_UPLOAD,
  }),
  getRateLimitConfig: () => ({
    requests: getEnv().NEXT_PUBLIC_RATE_LIMIT_REQUESTS,
    window: getEnv().NEXT_PUBLIC_RATE_LIMIT_WINDOW,
  }),
};

// Validate environment on module load (only in non-test environments)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironment();

    if (env.isDevelopment()) {
      console.log('✅ Environment validation successful');

      if (env.isDebugMode()) {
        console.log('🐛 Debug mode enabled');
        console.log('📊 Analytics enabled:', env.isAnalyticsEnabled());
        console.log('🎨 Dark mode enabled:', env.isDarkModeEnabled());
        console.log('🔔 Notifications enabled:', env.isNotificationsEnabled());
      }
    }
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error('❌ Environment validation failed:');
      console.error(error.message);

      if (env.isDevelopment()) {
        console.error(
          '\n💡 Please check your .env.local file and ensure all required variables are set.'
        );
        console.error(
          '📋 Copy .env.example to .env.local and fill in the values.'
        );
      }
    }

    // Don't throw in production to prevent crashes
    if (env.isProduction()) {
      console.error(
        '⚠️  Environment validation failed in production. Using defaults where possible.'
      );
    } else {
      process.exit(1);
    }
  }
}
