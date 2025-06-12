/**
 * Test Configuration and Setup
 * Global test environment setup for security tests
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set up test environment variables if not present
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-purposes-only";
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "test-session-secret-for-testing";
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

if (!process.env.MONGODB_TEST_URI) {
  process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/event-portal-test";
}

// Ensure logs directory exists for security logging tests
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Global test setup
beforeAll(async () => {
  // Suppress console logs during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    global.originalConsoleLog = console.log;
    global.originalConsoleError = console.error;
    global.originalConsoleWarn = console.warn;

    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

// Global test cleanup
afterAll(async () => {
  // Restore console methods
  if (!process.env.DEBUG_TESTS) {
    console.log = global.originalConsoleLog;
    console.error = global.originalConsoleError;
    console.warn = global.originalConsoleWarn;
  }

  // Close database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Jest configuration for security tests
export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/coverage/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 30000,
  verbose: true,
};

// Mock functions for testing
export const mockRequest = (
  body = {},
  params = {},
  query = {},
  headers = {}
) => ({
  body,
  params,
  query,
  headers,
  get: jest.fn((name) => headers[name.toLowerCase()]),
  ip: "127.0.0.1",
  user: null,
});

export const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();

// Test data generators
export const generateValidUserData = () => ({
  name: "Test User",
  username: "testuser123",
  email: "test@example.com",
  password: "SecurePassword123!",
  confirmPassword: "SecurePassword123!",
});

export const generateValidEventData = () => ({
  title: "Test Event",
  description:
    "This is a test event with a valid description that meets the minimum length requirement.",
  type: "Tech",
  startDate: "2024-12-25",
  endDate: "2024-12-25",
  startTime: "09:00",
  endTime: "17:00",
  location: "Test Location",
  image: "https://example.com/image.jpg",
  club: new mongoose.Types.ObjectId(),
});

export const generateMaliciousData = () => ({
  xss: '<script>alert("xss")</script>',
  htmlInjection: "<img src=x onerror=alert(1)>",
  sqlInjection: "'; DROP TABLE users; --",
  nosqlInjection: { $ne: null },
  pathTraversal: "../../../etc/passwd",
  commandInjection: "; cat /etc/passwd",
  jsInjection: 'javascript:alert("xss")',
});

// Security test utilities
export const isPasswordSecure = (password) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[@$!%*?&#+\-_=]/.test(password);

  return (
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumbers &&
    hasSpecialChars
  );
};

export const containsXSS = (input) => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror/i,
    /onload/i,
    /onclick/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
};

export const containsNoSQLInjection = (input) => {
  if (typeof input === "object" && input !== null) {
    const keys = Object.keys(input);
    return keys.some((key) => key.startsWith("$"));
  }
  return false;
};

export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Database test utilities
export const clearDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

export const createTestUser = async (userData = {}) => {
  const User = (await import("../models/user.model.js")).default;
  const defaultData = generateValidUserData();
  const finalData = { ...defaultData, ...userData };

  return await User.create(finalData);
};

// Performance testing utilities
export const measureExecutionTime = async (fn) => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds

  return { result, duration };
};

// Assertion helpers
export const expectSecurityHeaders = (response) => {
  // Check for common security headers
  const headers = response.headers;

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBeTruthy();
  expect(headers["x-xss-protection"]).toBeTruthy();
  // Note: These will only pass if helmet or similar middleware is implemented
};

export const expectNoSensitiveInfo = (response) => {
  const body = JSON.stringify(response.body);

  // Check that response doesn't contain sensitive information
  expect(body).not.toMatch(/password/i);
  expect(body).not.toMatch(/secret/i);
  expect(body).not.toMatch(/token/i);
  expect(body).not.toMatch(/key/i);
  expect(body).not.toMatch(/hash/i);
  expect(body).not.toMatch(/salt/i);
};

export const expectSanitizedInput = (input, output) => {
  // Verify that malicious content has been sanitized
  if (typeof output === "string") {
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("javascript:");
    expect(output).not.toContain("onerror=");
  }

  if (typeof output === "object" && output !== null) {
    const keys = Object.keys(output);
    keys.forEach((key) => {
      expect(key).not.toMatch(/^\$/); // No MongoDB operators
    });
  }
};
