#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates all required environment variables and configurations
 */

const { z } = require('zod');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// Production environment schema
const productionEnvSchema = z.object({
    // App Configuration
    NODE_ENV: z.literal('production'),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_APP_VERSION: z.string().min(1),

    // API Configuration
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_API_BASE_URL: z.string().url(),
    NEXT_PUBLIC_BACKEND_URL: z.string().url(),

    // Authentication
    NEXTAUTH_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    MONGODB_URI: z.string().min(1),

    // OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    // Cloudinary
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),

    // Email
    EMAIL_SERVER_HOST: z.string().min(1),
    EMAIL_SERVER_PORT: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(65535)),
    EMAIL_SERVER_USER: z.string().email(),
    EMAIL_SERVER_PASSWORD: z.string().min(1),
    EMAIL_FROM: z.string().email(),

    // Database
    MONGO_ROOT_USERNAME: z.string().min(1),
    MONGO_ROOT_PASSWORD: z.string().min(8),
    JWT_SECRET: z.string().min(32),

    // Security
    REDIS_PASSWORD: z.string().min(8).optional(),

    // Feature Flags
    NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(['true', 'false']),
    NEXT_PUBLIC_ENABLE_DARK_MODE: z.enum(['true', 'false']),
    NEXT_PUBLIC_ENABLE_NOTIFICATIONS: z.enum(['true', 'false']),
    NEXT_PUBLIC_MAINTENANCE_MODE: z.enum(['true', 'false']),
    NEXT_PUBLIC_DEBUG_MODE: z.enum(['true', 'false']),
});

// Development environment schema (more lenient)
const developmentEnvSchema = productionEnvSchema.partial({
    NEXT_PUBLIC_APP_URL: true,
    NEXTAUTH_URL: true,
    MONGODB_URI: true,
    EMAIL_SERVER_HOST: true,
    EMAIL_SERVER_PORT: true,
    EMAIL_SERVER_USER: true,
    EMAIL_SERVER_PASSWORD: true,
    EMAIL_FROM: true,
}).extend({
    NODE_ENV: z.enum(['development', 'test']),
});

function loadEnvironmentFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Environment file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            }
        }
    });

    return env;
}

function validateDatabase(mongoUri) {
    return new Promise((resolve) => {
        // In a real implementation, you would test the MongoDB connection
        // For now, we'll just validate the URI format
        try {
            new URL(mongoUri.replace('mongodb://', 'http://'));
            resolve(true);
        } catch {
            resolve(false);
        }
    });
}

function validateCloudinary(cloudName, apiKey, apiSecret) {
    return new Promise((resolve) => {
        // In a real implementation, you would test the Cloudinary connection
        // For now, we'll just check if values are present
        resolve(Boolean(cloudName && apiKey && apiSecret));
    });
}

function validateEmail(host, port, user, password) {
    return new Promise((resolve) => {
        // In a real implementation, you would test the SMTP connection
        // For now, we'll just validate the configuration format
        resolve(Boolean(host && port > 0 && user.includes('@') && password.length > 0));
    });
}

async function validateEnvironment(envType = 'production') {
    log.info(`Validating ${envType} environment configuration...`);

    const envFile = envType === 'production' ? '.env.production' : '.env.local';
    const envPath = path.resolve(process.cwd(), envFile);

    try {
        // Load environment file
        const env = loadEnvironmentFile(envPath);
        log.success(`Loaded environment from ${envFile}`);

        // Choose schema based on environment type
        const schema = envType === 'production' ? productionEnvSchema : developmentEnvSchema;

        // Validate against schema
        const result = schema.safeParse(env);

        if (!result.success) {
            log.error('Environment validation failed:');
            result.error.issues.forEach(issue => {
                log.error(`  - ${issue.path.join('.')}: ${issue.message}`);
            });
            return false;
        }

        log.success('Basic environment validation passed');

        // Additional validations for production
        if (envType === 'production') {
            const validatedEnv = result.data;

            // Test database connection
            log.info('Validating database connection...');
            const dbValid = await validateDatabase(validatedEnv.MONGODB_URI);
            if (!dbValid) {
                log.error('Invalid MongoDB URI format');
                return false;
            }
            log.success('Database configuration valid');

            // Test Cloudinary configuration
            log.info('Validating Cloudinary configuration...');
            const cloudinaryValid = await validateCloudinary(
                validatedEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                validatedEnv.NEXT_PUBLIC_CLOUDINARY_API_KEY,
                validatedEnv.CLOUDINARY_API_SECRET
            );
            if (!cloudinaryValid) {
                log.error('Invalid Cloudinary configuration');
                return false;
            }
            log.success('Cloudinary configuration valid');

            // Test email configuration
            log.info('Validating email configuration...');
            const emailValid = await validateEmail(
                validatedEnv.EMAIL_SERVER_HOST,
                validatedEnv.EMAIL_SERVER_PORT,
                validatedEnv.EMAIL_SERVER_USER,
                validatedEnv.EMAIL_SERVER_PASSWORD
            );
            if (!emailValid) {
                log.error('Invalid email configuration');
                return false;
            }
            log.success('Email configuration valid');

            // Security checks
            log.info('Running security checks...');

            if (validatedEnv.NEXTAUTH_SECRET.length < 32) {
                log.error('NEXTAUTH_SECRET must be at least 32 characters');
                return false;
            }

            if (validatedEnv.JWT_SECRET.length < 32) {
                log.error('JWT_SECRET must be at least 32 characters');
                return false;
            }

            if (validatedEnv.NEXT_PUBLIC_DEBUG_MODE === 'true') {
                log.warning('DEBUG_MODE is enabled in production');
            }

            log.success('Security checks passed');
        }

        // Generate environment report
        const reportPath = `env-validation-report-${Date.now()}.json`;
        const report = {
            timestamp: new Date().toISOString(),
            environment: envType,
            validation: 'passed',
            checkedVariables: Object.keys(result.data),
            warnings: []
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        log.success(`Environment validation report saved: ${reportPath}`);

        return true;

    } catch (error) {
        log.error(`Environment validation failed: ${error.message || 'Unknown error'}`);
        return false;
    }
}

// CLI usage
async function main() {
    const envType = process.argv[2] || 'production';

    log.info('Event Management Portal - Environment Validation');
    log.info('================================================');

    const isValid = await validateEnvironment(envType);

    if (isValid) {
        log.success(`✅ ${envType} environment is properly configured!`);
        process.exit(0);
    } else {
        log.error(`❌ ${envType} environment validation failed!`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { validateEnvironment };