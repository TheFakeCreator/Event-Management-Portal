const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
})

// Add any custom config to be passed to Jest
const config = {
    // Add more setup options before each test is run
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
    moduleDirectories: ['node_modules', '<rootDir>/'],

    // Handle module aliases (correct option name)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
    },

    testEnvironment: 'jest-environment-jsdom',

    // Test file patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
        '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/index.{ts,tsx}',
        '!src/app/**/layout.tsx',
        '!src/app/**/loading.tsx',
        '!src/app/**/not-found.tsx',
        '!src/app/**/error.tsx',
    ],

    coverageReporters: ['text', 'lcov', 'html'],
    coverageDirectory: 'coverage',

    // Setup files
    setupFiles: ['<rootDir>/jest.polyfills.js'],

    // Test environment options
    testEnvironmentOptions: {
        customExportConditions: [''],
    },

    // Ignore patterns
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

    // Transform ignore patterns for node_modules
    transformIgnorePatterns: [
        'node_modules/(?!(next-auth|@next-auth|@auth|jose|preact-render-to-string|@testing-library)/)',
    ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)