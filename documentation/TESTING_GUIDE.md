# Testing Guide

## Table of Contents

1. [Overview](#overview)
2. [Testing Framework & Setup](#testing-framework--setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Performance Testing](#performance-testing)
7. [Visual Regression Testing](#visual-regression-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Security Testing](#security-testing)
10. [Test Scripts & Automation](#test-scripts--automation)
11. [Best Practices & Guidelines](#best-practices--guidelines)
12. [Troubleshooting](#troubleshooting)
13. [Related Documentation](#related-documentation)

## Overview

This document provides comprehensive testing strategies, procedures, and best practices for the Event Management Portal application. It covers unit testing, integration testing, end-to-end testing, and testing workflows.

## Testing Framework & Setup

### 1. Testing Stack

#### Core Testing Libraries

```json
{
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "mongoose-mock": "^0.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "puppeteer": "^20.3.0",
    "selenium-webdriver": "^4.10.0",
    "nyc": "^15.1.0",
    "eslint": "^8.42.0"
  }
}
```

#### Test Configuration

```javascript
// jest.config.js
export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "middlewares/**/*.js",
    "models/**/*.js",
    "controllers/**/*.js",
    "!node_modules/**",
    "!tests/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ["text", "lcov", "html"],
};
```

### 2. Test Environment Setup

#### Database Setup

```javascript
// tests/setup.js
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

#### Test Utilities

```javascript
// tests/utils/testHelpers.js
import User from "../../models/User.js";
import Event from "../../models/Event.js";
import Club from "../../models/Club.js";
import jwt from "jsonwebtoken";

const createTestUser = async (overrides = {}) => {
  const userData = {
    username: "testuser",
    email: "test@example.com",
    password: "TestPass123!",
    emailVerified: true,
    ...overrides,
  };

  const user = new User(userData);
  await user.save();
  return user;
};

const createAuthToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );
};

const createTestEvent = async (createdBy, overrides = {}) => {
  const eventData = {
    title: "Test Event",
    description: "Test event description",
    date: new Date(Date.now() + 86400000), // Tomorrow
    location: "Test Location",
    capacity: 50,
    createdBy: createdBy._id,
    ...overrides,
  };

  const event = new Event(eventData);
  await event.save();
  return event;
};

const createTestClub = async (createdBy, overrides = {}) => {
  const clubData = {
    name: "Test Club",
    description: "Test club description",
    category: "Technology",
    createdBy: createdBy._id,
    moderators: [createdBy._id],
    ...overrides,
  };

  const club = new Club(clubData);
  await club.save();
  return club;
};

export { createTestUser, createAuthToken, createTestEvent, createTestClub };
```

## Unit Testing

### 1. Model Testing

#### User Model Tests

```javascript
// tests/models/User.test.js
import User from "../../models/User.js";
import { createTestUser } from "../utils/testHelpers.js";

describe("User Model", () => {
  describe("User Creation", () => {
    test("should create a valid user", async () => {
      const user = await createTestUser();
      expect(user.username).toBe("testuser");
      expect(user.email).toBe("test@example.com");
      expect(user.role).toBe("user");
      expect(user.emailVerified).toBe(true);
    });

    test("should hash password before saving", async () => {
      const user = await createTestUser({ password: "plaintext" });
      expect(user.password).not.toBe("plaintext");
      expect(user.password.length).toBeGreaterThan(10);
    });

    test("should reject invalid email format", async () => {
      await expect(
        createTestUser({ email: "invalid-email" })
      ).rejects.toThrow();
    });

    test("should reject duplicate username", async () => {
      await createTestUser({ username: "duplicate" });
      await expect(
        createTestUser({ username: "duplicate", email: "other@example.com" })
      ).rejects.toThrow();
    });
  });

  describe("User Methods", () => {
    test("should verify correct password", async () => {
      const user = await createTestUser({ password: "TestPass123!" });
      const isValid = await user.comparePassword("TestPass123!");
      expect(isValid).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const user = await createTestUser({ password: "TestPass123!" });
      const isValid = await user.comparePassword("wrongpassword");
      expect(isValid).toBe(false);
    });

    test("should generate verification token", async () => {
      const user = await createTestUser();
      const token = user.generateVerificationToken();
      expect(token).toBeDefined();
      expect(user.emailVerificationToken).toBeDefined();
      expect(user.emailVerificationExpires).toBeInstanceOf(Date);
    });
  });
});
```

#### Event Model Tests

```javascript
// tests/models/Event.test.js
import Event from "../../models/Event.js";
import { createTestUser, createTestEvent } from "../utils/testHelpers.js";

describe("Event Model", () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe("Event Creation", () => {
    test("should create a valid event", async () => {
      const event = await createTestEvent(testUser);
      expect(event.title).toBe("Test Event");
      expect(event.createdBy).toEqual(testUser._id);
      expect(event.status).toBe("active");
    });

    test("should require title and description", async () => {
      await expect(createTestEvent(testUser, { title: "" })).rejects.toThrow();
    });

    test("should validate date is in future", async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      await expect(
        createTestEvent(testUser, { date: pastDate })
      ).rejects.toThrow();
    });
  });

  describe("Event Methods", () => {
    test("should register user for event", async () => {
      const event = await createTestEvent(testUser);
      const attendee = await createTestUser({
        username: "attendee",
        email: "attendee@example.com",
      });

      await event.registerUser(attendee._id);
      expect(event.registrations).toHaveLength(1);
      expect(event.registrations[0].user).toEqual(attendee._id);
    });

    test("should check if event is full", async () => {
      const event = await createTestEvent(testUser, { capacity: 1 });
      const attendee = await createTestUser({
        username: "attendee",
        email: "attendee@example.com",
      });

      await event.registerUser(attendee._id);
      expect(event.isFull()).toBe(true);
    });

    test("should get registered user count", async () => {
      const event = await createTestEvent(testUser);
      const attendee1 = await createTestUser({
        username: "attendee1",
        email: "attendee1@example.com",
      });
      const attendee2 = await createTestUser({
        username: "attendee2",
        email: "attendee2@example.com",
      });

      await event.registerUser(attendee1._id);
      await event.registerUser(attendee2._id);

      expect(event.getRegisteredCount()).toBe(2);
    });
  });
});
```

### 2. Middleware Testing

#### Authentication Middleware Tests

```javascript
// tests/middlewares/auth.test.js
import {
  isAuthenticated,
  isAdmin,
  isClubModerator,
} from "../../middlewares/auth.js";
import {
  createTestUser,
  createAuthToken,
  createTestClub,
} from "../utils/testHelpers.js";

describe("Authentication Middleware", () => {
  describe("isAuthenticated", () => {
    test("should allow access with valid token", async () => {
      const user = await createTestUser();
      const token = createAuthToken(user);

      const req = {
        cookies: { token },
        user: null,
      };
      const res = {};
      const next = jest.fn();

      await isAuthenticated(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user._id.toString());
      expect(next).toHaveBeenCalled();
    });

    test("should redirect to login without token", async () => {
      const req = { cookies: {} };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      await isAuthenticated(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith("/auth/login");
      expect(next).not.toHaveBeenCalled();
    });

    test("should redirect to login with invalid token", async () => {
      const req = { cookies: { token: "invalid-token" } };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      await isAuthenticated(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith("/auth/login");
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    test("should allow access for admin user", async () => {
      const admin = await createTestUser({ role: "admin" });

      const req = { user: { role: "admin", id: admin._id } };
      const res = {};
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("should deny access for non-admin user", async () => {
      const user = await createTestUser({ role: "user" });

      const req = { user: { role: "user", id: user._id } };
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalledWith(
        "error",
        expect.objectContaining({ message: "Access denied" })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isClubModerator", () => {
    test("should allow access for club moderator", async () => {
      const moderator = await createTestUser({ role: "moderator" });
      const club = await createTestClub(moderator);

      const req = {
        user: { role: "moderator", id: moderator._id },
        params: { id: club._id },
      };
      const res = {};
      const next = jest.fn();

      await isClubModerator(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test("should allow access for admin", async () => {
      const admin = await createTestUser({ role: "admin" });
      const moderator = await createTestUser({
        username: "moderator",
        email: "mod@example.com",
      });
      const club = await createTestClub(moderator);

      const req = {
        user: { role: "admin", id: admin._id },
        params: { id: club._id },
      };
      const res = {};
      const next = jest.fn();

      await isClubModerator(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
```

## Integration Testing

### 1. Route Testing

#### Authentication Routes

```javascript
// tests/routes/auth.test.js
import request from "supertest";
import app from "../../app.js";
import { createTestUser } from "../utils/testHelpers.js";

describe("Authentication Routes", () => {
  describe("POST /auth/signup", () => {
    test("should register new user successfully", async () => {
      const userData = {
        username: "newuser",
        email: "newuser@example.com",
        password: "NewPass123!",
        confirmPassword: "NewPass123!",
      };

      const response = await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(302);

      expect(response.headers.location).toBe("/auth/login");
    });

    test("should reject registration with invalid email", async () => {
      const userData = {
        username: "newuser",
        email: "invalid-email",
        password: "NewPass123!",
        confirmPassword: "NewPass123!",
      };

      const response = await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(400);

      expect(response.text).toContain("Invalid email format");
    });

    test("should reject registration with weak password", async () => {
      const userData = {
        username: "newuser",
        email: "newuser@example.com",
        password: "weak",
        confirmPassword: "weak",
      };

      const response = await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(400);

      expect(response.text).toContain("Password too weak");
    });
  });

  describe("POST /auth/login", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    test("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          login: testUser.email,
          password: "TestPass123!",
        })
        .expect(302);

      expect(response.headers.location).toBe("/");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    test("should reject login with invalid password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          login: testUser.email,
          password: "wrongpassword",
        })
        .expect(400);

      expect(response.text).toContain("Invalid credentials");
    });

    test("should reject login for non-existent user", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          login: "nonexistent@example.com",
          password: "TestPass123!",
        })
        .expect(400);

      expect(response.text).toContain("User not found");
    });
  });

  describe("POST /auth/logout", () => {
    test("should logout user and clear cookie", async () => {
      const user = await createTestUser();
      const token = createAuthToken(user);

      const response = await request(app)
        .post("/auth/logout")
        .set("Cookie", `token=${token}`)
        .expect(302);

      expect(response.headers.location).toBe("/");
      expect(response.headers["set-cookie"][0]).toContain("token=;");
    });
  });
});
```

#### Event Routes

```javascript
// tests/routes/events.test.js
import request from "supertest";
import app from "../../app.js";
import {
  createTestUser,
  createAuthToken,
  createTestEvent,
} from "../utils/testHelpers.js";

describe("Event Routes", () => {
  let testUser, authToken;

  beforeEach(async () => {
    testUser = await createTestUser({ role: "moderator" });
    authToken = createAuthToken(testUser);
  });

  describe("GET /events", () => {
    test("should display events list", async () => {
      await createTestEvent(testUser);

      const response = await request(app).get("/events").expect(200);

      expect(response.text).toContain("Test Event");
    });

    test("should filter events by category", async () => {
      await createTestEvent(testUser, { category: "Technology" });
      await createTestEvent(testUser, {
        title: "Sports Event",
        category: "Sports",
      });

      const response = await request(app)
        .get("/events?category=Technology")
        .expect(200);

      expect(response.text).toContain("Test Event");
      expect(response.text).not.toContain("Sports Event");
    });
  });

  describe("POST /events/create", () => {
    test("should create event with valid data", async () => {
      const eventData = {
        title: "New Event",
        description: "Event description",
        date: new Date(Date.now() + 86400000).toISOString(),
        location: "Event Location",
        capacity: 100,
        category: "Technology",
      };

      const response = await request(app)
        .post("/events/create")
        .set("Cookie", `token=${authToken}`)
        .send(eventData)
        .expect(302);

      expect(response.headers.location).toBe("/events");
    });

    test("should require authentication", async () => {
      const eventData = {
        title: "New Event",
        description: "Event description",
      };

      const response = await request(app)
        .post("/events/create")
        .send(eventData)
        .expect(302);

      expect(response.headers.location).toBe("/auth/login");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/events/create")
        .set("Cookie", `token=${authToken}`)
        .send({})
        .expect(400);

      expect(response.text).toContain("Title is required");
    });
  });

  describe("POST /events/:id/register", () => {
    let event;

    beforeEach(async () => {
      event = await createTestEvent(testUser);
    });

    test("should register user for event", async () => {
      const attendee = await createTestUser({
        username: "attendee",
        email: "attendee@example.com",
      });
      const attendeeToken = createAuthToken(attendee);

      const response = await request(app)
        .post(`/events/${event._id}/register`)
        .set("Cookie", `token=${attendeeToken}`)
        .expect(302);

      expect(response.headers.location).toBe(`/events/${event._id}`);
    });

    test("should not allow double registration", async () => {
      const attendee = await createTestUser({
        username: "attendee",
        email: "attendee@example.com",
      });
      const attendeeToken = createAuthToken(attendee);

      // First registration
      await request(app)
        .post(`/events/${event._id}/register`)
        .set("Cookie", `token=${attendeeToken}`)
        .expect(302);

      // Attempt second registration
      const response = await request(app)
        .post(`/events/${event._id}/register`)
        .set("Cookie", `token=${attendeeToken}`)
        .expect(400);

      expect(response.text).toContain("Already registered");
    });
  });
});
```

### 2. Database Integration Testing

#### User Operations

```javascript
// tests/integration/userOperations.test.js
import User from "../../models/User.js";
import { createTestUser } from "../utils/testHelpers.js";

describe("User Database Operations", () => {
  describe("User CRUD Operations", () => {
    test("should create and retrieve user", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "TestPass123!",
      };

      const user = new User(userData);
      await user.save();

      const retrievedUser = await User.findById(user._id);
      expect(retrievedUser.username).toBe(userData.username);
      expect(retrievedUser.email).toBe(userData.email);
    });

    test("should update user profile", async () => {
      const user = await createTestUser();

      user.bio = "Updated bio";
      user.interests = ["Technology", "Sports"];
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.bio).toBe("Updated bio");
      expect(updatedUser.interests).toEqual(["Technology", "Sports"]);
    });

    test("should delete user", async () => {
      const user = await createTestUser();
      const userId = user._id;

      await User.findByIdAndDelete(userId);

      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });
  });

  describe("User Relationships", () => {
    test("should populate user events", async () => {
      const user = await createTestUser({ role: "moderator" });
      const event = await createTestEvent(user);

      const populatedUser = await User.findById(user._id).populate(
        "createdEvents"
      );

      expect(populatedUser.createdEvents).toHaveLength(1);
      expect(populatedUser.createdEvents[0]._id).toEqual(event._id);
    });
  });
});
```

## End-to-End Testing

### 1. Browser Testing Setup

#### Puppeteer Configuration

```javascript
// tests/e2e/setup.js
import puppeteer from "puppeteer";

let browser, page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: process.env.CI === "true",
    slowMo: process.env.CI ? 0 : 50,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
});

beforeEach(async () => {
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
});

afterEach(async () => {
  if (page) {
    await page.close();
  }
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

const waitForSelector = async (selector, timeout = 5000) => {
  return page.waitForSelector(selector, { timeout });
};

const clickAndWait = async (selector, waitForNavigation = true) => {
  await page.click(selector);
  if (waitForNavigation) {
    await page.waitForNavigation({ waitUntil: "networkidle0" });
  }
};

export {
  browser,
  page: () => page,
  waitForSelector,
  clickAndWait,
};
```

### 2. User Journey Tests

#### Authentication Flow

```javascript
// tests/e2e/auth.e2e.test.js
import { page, waitForSelector, clickAndWait } from "./setup.js";

describe("Authentication E2E Tests", () => {
  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

  describe("User Registration", () => {
    test("should register new user successfully", async () => {
      await page().goto(`${baseUrl}/auth/signup`);

      await page().type("#username", "testuser");
      await page().type("#email", "test@example.com");
      await page().type("#password", "TestPass123!");
      await page().type("#confirmPassword", "TestPass123!");

      await clickAndWait("#signup-btn");

      await waitForSelector(".success-message");
      const successMessage = await page().$eval(
        ".success-message",
        (el) => el.textContent
      );
      expect(successMessage).toContain("Registration successful");
    });

    test("should show validation errors for invalid input", async () => {
      await page().goto(`${baseUrl}/auth/signup`);

      await page().type("#username", "a"); // Too short
      await page().type("#email", "invalid-email");
      await page().type("#password", "weak");

      await page().click("#signup-btn");

      await waitForSelector(".error-message");
      const errorMessage = await page().$eval(
        ".error-message",
        (el) => el.textContent
      );
      expect(errorMessage).toContain("Username must be at least 3 characters");
    });
  });

  describe("User Login", () => {
    test("should login with valid credentials", async () => {
      // Assume user already exists
      await page().goto(`${baseUrl}/auth/login`);

      await page().type("#login", "test@example.com");
      await page().type("#password", "TestPass123!");

      await clickAndWait("#login-btn");

      await waitForSelector(".user-menu");
      const currentUrl = page().url();
      expect(currentUrl).toBe(`${baseUrl}/`);
    });

    test("should show error for invalid credentials", async () => {
      await page().goto(`${baseUrl}/auth/login`);

      await page().type("#login", "wrong@example.com");
      await page().type("#password", "wrongpassword");

      await page().click("#login-btn");

      await waitForSelector(".error-message");
      const errorMessage = await page().$eval(
        ".error-message",
        (el) => el.textContent
      );
      expect(errorMessage).toContain("Invalid credentials");
    });
  });
});
```

#### Event Management Flow

```javascript
// tests/e2e/events.e2e.test.js
import { page, waitForSelector, clickAndWait } from "./setup.js";

describe("Event Management E2E Tests", () => {
  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

  beforeEach(async () => {
    // Login as moderator
    await page().goto(`${baseUrl}/auth/login`);
    await page().type("#login", "moderator@example.com");
    await page().type("#password", "ModeratorPass123!");
    await clickAndWait("#login-btn");
  });

  describe("Event Creation", () => {
    test("should create new event successfully", async () => {
      await page().goto(`${baseUrl}/events/create`);

      await page().type("#title", "Test Event");
      await page().type("#description", "This is a test event");
      await page().type("#location", "Test Location");
      await page().type("#capacity", "50");

      // Set date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split("T")[0];
      await page().type("#date", dateString);

      await page().select("#category", "Technology");

      await clickAndWait("#create-event-btn");

      await waitForSelector(".success-message");
      const successMessage = await page().$eval(
        ".success-message",
        (el) => el.textContent
      );
      expect(successMessage).toContain("Event created successfully");
    });

    test("should validate required fields", async () => {
      await page().goto(`${baseUrl}/events/create`);

      await page().click("#create-event-btn");

      await waitForSelector(".error-message");
      const errorMessage = await page().$eval(
        ".error-message",
        (el) => el.textContent
      );
      expect(errorMessage).toContain("Title is required");
    });
  });

  describe("Event Registration", () => {
    test("should register for event successfully", async () => {
      await page().goto(`${baseUrl}/events`);

      await clickAndWait(".event-card:first-child .view-details-btn");
      await clickAndWait("#register-btn");

      await waitForSelector(".success-message");
      const successMessage = await page().$eval(
        ".success-message",
        (el) => el.textContent
      );
      expect(successMessage).toContain("Registration successful");
    });

    test("should show registration button for non-registered users", async () => {
      await page().goto(`${baseUrl}/events`);
      await clickAndWait(".event-card:first-child .view-details-btn");

      const registerBtn = await page().$("#register-btn");
      expect(registerBtn).toBeTruthy();
    });
  });
});
```

## Performance Testing

### 1. Load Testing

#### Database Performance

```javascript
// tests/performance/database.perf.test.js
import { createTestUser, createTestEvent } from "../utils/testHelpers.js";
import User from "../../models/User.js";
import Event from "../../models/Event.js";

describe("Database Performance Tests", () => {
  describe("User Operations", () => {
    test("should handle bulk user creation", async () => {
      const startTime = Date.now();
      const users = [];

      for (let i = 0; i < 100; i++) {
        users.push({
          username: `user${i}`,
          email: `user${i}@example.com`,
          password: "TestPass123!",
        });
      }

      await User.insertMany(users);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds
    });

    test("should efficiently query users with pagination", async () => {
      // Create test users
      const users = Array.from({ length: 50 }, (_, i) => ({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: "TestPass123!",
      }));
      await User.insertMany(users);

      const startTime = Date.now();
      const result = await User.find({})
        .limit(10)
        .skip(0)
        .sort({ createdAt: -1 });
      const endTime = Date.now();

      expect(result).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
    });
  });

  describe("Event Operations", () => {
    test("should handle event search efficiently", async () => {
      const user = await createTestUser({ role: "moderator" });

      // Create multiple events
      const events = Array.from({ length: 50 }, (_, i) => ({
        title: `Event ${i}`,
        description: `Description for event ${i}`,
        date: new Date(Date.now() + i * 86400000),
        location: `Location ${i}`,
        capacity: 50,
        createdBy: user._id,
        category: i % 2 === 0 ? "Technology" : "Sports",
      }));
      await Event.insertMany(events);

      const startTime = Date.now();
      const searchResults = await Event.find({
        $or: [
          { title: { $regex: "Event", $options: "i" } },
          { description: { $regex: "Event", $options: "i" } },
        ],
      }).limit(10);
      const endTime = Date.now();

      expect(searchResults.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(200); // Less than 200ms
    });
  });
});
```

#### API Performance

```javascript
// tests/performance/api.perf.test.js
import request from "supertest";
import app from "../../app.js";
import { createTestUser, createAuthToken } from "../utils/testHelpers.js";

describe("API Performance Tests", () => {
  let authToken;
  let user;

  beforeAll(async () => {
    user = await createTestUser({ role: "admin" });
    authToken = createAuthToken(user);
  });

  describe("Authentication Endpoints", () => {
    test("login endpoint should respond quickly", async () => {
      const startTime = Date.now();

      const response = await request(app).post("/api/auth/login").send({
        email: user.email,
        password: "TestPass123!",
      });

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500); // Less than 500ms
    });

    test("should handle concurrent login requests", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).post("/api/auth/login").send({
          email: user.email,
          password: "TestPass123!",
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
    });
  });

  describe("Events Endpoints", () => {
    test("events listing should be performant", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get("/api/events")
        .set("Authorization", `Bearer ${authToken}`);

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(300); // Less than 300ms
    });

    test("should handle pagination efficiently", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get("/api/events?page=1&limit=10")
        .set("Authorization", `Bearer ${authToken}`);

      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(200); // Less than 200ms
    });
  });
});
```

### 2. Stress Testing

```javascript
// tests/performance/stress.test.js
import request from "supertest";
import app from "../../app.js";
import { createTestUser, createAuthToken } from "../utils/testHelpers.js";

describe("Stress Tests", () => {
  let authToken;
  let user;
  beforeAll(async () => {
    user = await createTestUser({ role: "admin" });
    authToken = createAuthToken(user);
  });

  test("should handle high number of concurrent requests", async () => {
    const numberOfRequests = 50;
    const promises = [];

    for (let i = 0; i < numberOfRequests; i++) {
      promises.push(
        request(app)
          .get("/api/events")
          .set("Authorization", `Bearer ${authToken}`)
      );
    }

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // All requests should succeed
    responses.forEach((response, index) => {
      expect(response.status).toBe(200);
    });

    // Should handle all requests within reasonable time
    expect(endTime - startTime).toBeLessThan(10000); // Less than 10 seconds

    console.log(
      `Handled ${numberOfRequests} requests in ${endTime - startTime}ms`
    );
  });

  test("should handle rapid user registration attempts", async () => {
    const numberOfRegistrations = 20;
    const promises = [];

    for (let i = 0; i < numberOfRegistrations; i++) {
      promises.push(
        request(app)
          .post("/api/auth/signup")
          .send({
            username: `stressuser${i}`,
            email: `stressuser${i}@example.com`,
            password: "TestPass123!",
          })
      );
    }

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // Most requests should succeed (some might fail due to rate limiting)
    const successCount = responses.filter((r) => r.status === 201).length;
    expect(successCount).toBeGreaterThan(numberOfRegistrations * 0.7); // At least 70% success

    console.log(
      `${successCount}/${numberOfRegistrations} registrations succeeded in ${
        endTime - startTime
      }ms`
    );
  });
});
```

### 3. Memory Usage Testing

```javascript
// tests/performance/memory.test.js
const { createTestUser, createTestEvent } = require("../utils/testHelpers");
const User = require("../../models/User");
const Event = require("../../models/Event");

describe("Memory Usage Tests", () => {
  test("should not leak memory during bulk operations", async () => {
    const initialMemory = process.memoryUsage();

    // Create many users
    const users = Array.from({ length: 100 }, (_, i) => ({
      username: `memuser${i}`,
      email: `memuser${i}@example.com`,
      password: "TestPass123!",
    }));

    await User.insertMany(users);

    // Query users multiple times
    for (let i = 0; i < 10; i++) {
      await User.find({}).limit(50);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

    console.log(
      `Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
    );
  });
});
```

### 4. Performance Monitoring

```javascript
// tests/utils/performanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  startTimer(name) {
    this.metrics[name] = {
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
    };
  }

  endTimer(name) {
    if (!this.metrics[name]) {
      throw new Error(`Timer ${name} not found`);
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    this.metrics[name].duration = endTime - this.metrics[name].startTime;
    this.metrics[name].memoryDelta =
      endMemory.heapUsed - this.metrics[name].startMemory.heapUsed;

    return this.metrics[name];
  }

  getMetrics() {
    return this.metrics;
  }

  logMetrics() {
    console.log("\n=== Performance Metrics ===");
    Object.entries(this.metrics).forEach(([name, metric]) => {
      console.log(`${name}:`);
      console.log(`  Duration: ${metric.duration}ms`);
      console.log(`  Memory Delta: ${Math.round(metric.memoryDelta / 1024)}KB`);
    });
    console.log("===========================\n");
  }
}

export default PerformanceMonitor;
```

Usage example:

```javascript
// In your test files
import PerformanceMonitor from "../utils/performanceMonitor.js";

describe("Performance monitored tests", () => {
  const monitor = new PerformanceMonitor();

  afterAll(() => {
    monitor.logMetrics();
  });

  test("should monitor database operations", async () => {
    monitor.startTimer("userCreation");

    const user = await createTestUser();

    const metrics = monitor.endTimer("userCreation");

    expect(metrics.duration).toBeLessThan(1000); // Less than 1 second
    expect(metrics.memoryDelta).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
  });
});
```

      }));
      await Event.insertMany(events);

      const startTime = Date.now();
      const searchResults = await Event.find({
        $or: [
          { title: { $regex: "Event", $options: "i" } },
          { description: { $regex: "Event", $options: "i" } },
        ],
      }).limit(10);
      const endTime = Date.now();

      expect(searchResults.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(200); // Less than 200ms
    });

});
});

````

### 2. API Performance

```javascript
// tests/performance/api.perf.test.js
const request = require("supertest");
const app = require("../../app");
const { createTestUser, createAuthToken } = require("../utils/testHelpers");

describe("API Performance Tests", () => {
  let testUser, authToken;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = createAuthToken(testUser);
  });

  describe("Route Performance", () => {
    test("should handle homepage load efficiently", async () => {
      const startTime = Date.now();

      await request(app).get("/").expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Less than 500ms
    });

    test("should handle events API efficiently", async () => {
      const startTime = Date.now();

      await request(app).get("/events").expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(300); // Less than 300ms
    });

    test("should handle authenticated routes efficiently", async () => {
      const startTime = Date.now();

      await request(app)
        .get("/user/profile")
        .set("Cookie", `token=${authToken}`)
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200); // Less than 200ms
    });
  });

  describe("Concurrent Request Handling", () => {
    test("should handle multiple concurrent requests", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get("/events").expect(200)
      );

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
    });
  });
});
````

## Visual Regression Testing

Visual regression testing ensures that UI changes don't unintentionally break the visual appearance of the application.

### 1. Setup with Puppeteer and Pixelmatch

```javascript
// tests/visual/setup.js
import puppeteer from "puppeteer";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";

class VisualTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baselinePath = path.join(__dirname, "baselines");
    this.actualPath = path.join(__dirname, "actual");
    this.diffPath = path.join(__dirname, "diff");

    // Ensure directories exist
    [this.baselinePath, this.actualPath, this.diffPath].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(name, selector = null) {
    const filename = `${name}.png`;
    const actualPath = path.join(this.actualPath, filename);

    if (selector) {
      const element = await this.page.$(selector);
      if (element) {
        await element.screenshot({ path: actualPath });
      } else {
        throw new Error(`Element ${selector} not found`);
      }
    } else {
      await this.page.screenshot({ path: actualPath, fullPage: true });
    }

    return actualPath;
  }

  async compareScreenshots(name, threshold = 0.1) {
    const baselinePath = path.join(this.baselinePath, `${name}.png`);
    const actualPath = path.join(this.actualPath, `${name}.png`);
    const diffPath = path.join(this.diffPath, `${name}.png`);

    if (!fs.existsSync(baselinePath)) {
      // First run - copy actual to baseline
      fs.copyFileSync(actualPath, baselinePath);
      return { match: true, firstRun: true };
    }

    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const actual = PNG.sync.read(fs.readFileSync(actualPath));
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      baseline.data,
      actual.data,
      diff.data,
      width,
      height,
      { threshold }
    );

    const diffPercentage = numDiffPixels / (width * height);
    const match = diffPercentage < threshold;

    if (!match) {
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }

    return {
      match,
      diffPercentage,
      diffPixels: numDiffPixels,
      diffPath: match ? null : diffPath,
    };
  }
}

export default VisualTester;
```

### 2. Visual Test Cases

```javascript
// tests/visual/pages.visual.test.js
import VisualTester from "./setup.js";
import { createTestUser, createAuthToken } from "../utils/testHelpers.js";

describe("Visual Regression Tests", () => {
  let visualTester;
  let testUser;
  let authToken;

  beforeAll(async () => {
    visualTester = new VisualTester();
    await visualTester.setup();
    testUser = await createTestUser({ role: "user" });
    authToken = createAuthToken(testUser);
  });

  afterAll(async () => {
    await visualTester.teardown();
  });

  describe("Authentication Pages", () => {
    test("login page should match baseline", async () => {
      await visualTester.page.goto("http://localhost:3000/auth/login");
      await visualTester.page.waitForSelector(".login-form");

      await visualTester.takeScreenshot("login-page");
      const result = await visualTester.compareScreenshots("login-page");

      expect(result.match).toBe(true);
    });

    test("signup page should match baseline", async () => {
      await visualTester.page.goto("http://localhost:3000/auth/signup");
      await visualTester.page.waitForSelector(".signup-form");

      await visualTester.takeScreenshot("signup-page");
      const result = await visualTester.compareScreenshots("signup-page");

      expect(result.match).toBe(true);
    });
  });

  describe("Dashboard Pages", () => {
    beforeEach(async () => {
      // Set authentication cookie
      await visualTester.page.setCookie({
        name: "token",
        value: authToken,
        domain: "localhost",
      });
    });

    test("user dashboard should match baseline", async () => {
      await visualTester.page.goto("http://localhost:3000/dashboard");
      await visualTester.page.waitForSelector(".dashboard-content");

      await visualTester.takeScreenshot("user-dashboard");
      const result = await visualTester.compareScreenshots("user-dashboard");

      expect(result.match).toBe(true);
    });

    test("events listing should match baseline", async () => {
      await visualTester.page.goto("http://localhost:3000/events");
      await visualTester.page.waitForSelector(".events-container");

      await visualTester.takeScreenshot("events-listing");
      const result = await visualTester.compareScreenshots("events-listing");

      expect(result.match).toBe(true);
    });
  });

  describe("Component Visual Tests", () => {
    test("navigation header should match baseline", async () => {
      await visualTester.page.goto("http://localhost:3000/");
      await visualTester.page.waitForSelector("nav");

      await visualTester.takeScreenshot("navigation-header", "nav");
      const result = await visualTester.compareScreenshots("navigation-header");

      expect(result.match).toBe(true);
    });

    test("footer should match baseline", async () => {
      await visualTester.page.goto("http://localhost:3000/");
      await visualTester.page.waitForSelector("footer");

      await visualTester.takeScreenshot("footer", "footer");
      const result = await visualTester.compareScreenshots("footer");

      expect(result.match).toBe(true);
    });
  });
});
```

### 3. Responsive Visual Testing

```javascript
// tests/visual/responsive.visual.test.js
import VisualTester from "./setup.js";

describe("Responsive Visual Tests", () => {
  let visualTester;

  beforeAll(async () => {
    visualTester = new VisualTester();
    await visualTester.setup();
  });

  afterAll(async () => {
    await visualTester.teardown();
  });

  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 720 },
    { name: "wide", width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    describe(`${name} viewport (${width}x${height})`, () => {
      beforeEach(async () => {
        await visualTester.page.setViewport({ width, height });
      });

      test(`homepage should match baseline on ${name}`, async () => {
        await visualTester.page.goto("http://localhost:3000/");
        await visualTester.page.waitForSelector("main");

        await visualTester.takeScreenshot(`homepage-${name}`);
        const result = await visualTester.compareScreenshots(
          `homepage-${name}`
        );

        expect(result.match).toBe(true);
      });

      test(`events page should match baseline on ${name}`, async () => {
        await visualTester.page.goto("http://localhost:3000/events");
        await visualTester.page.waitForSelector(".events-container");

        await visualTester.takeScreenshot(`events-${name}`);
        const result = await visualTester.compareScreenshots(`events-${name}`);

        expect(result.match).toBe(true);
      });
    });
  });
});
```

## Accessibility Testing

Accessibility testing ensures the application is usable by people with disabilities and follows WCAG guidelines.

### 1. Setup with axe-core

```javascript
// tests/accessibility/setup.js
import { AxePuppeteer } from "@axe-core/puppeteer";
import puppeteer from "puppeteer";

class AccessibilityTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAccessibilityTests(url, options = {}) {
    await this.page.goto(url);

    // Wait for page to load
    (await this.page.waitForLoadState?.("networkidle")) ||
      (await this.page.waitForTimeout(1000));

    const axe = new AxePuppeteer(this.page);

    // Configure axe options
    if (options.include) {
      axe.include(options.include);
    }
    if (options.exclude) {
      axe.exclude(options.exclude);
    }
    if (options.tags) {
      axe.withTags(options.tags);
    }

    const results = await axe.analyze();
    return results;
  }

  formatViolations(violations) {
    return violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
      selectors: violation.nodes
        .map((node) => node.target.join(", "))
        .slice(0, 3),
    }));
  }
}

export default AccessibilityTester;
```

### 2. Accessibility Test Cases

```javascript
// tests/accessibility/pages.a11y.test.js
import AccessibilityTester from "./setup.js";
import { createTestUser, createAuthToken } from "../utils/testHelpers.js";

describe("Accessibility Tests", () => {
  let a11yTester;
  let testUser;
  let authToken;

  beforeAll(async () => {
    a11yTester = new AccessibilityTester();
    await a11yTester.setup();

    testUser = await createTestUser({ role: "user" });
    authToken = createAuthToken(testUser);
  });

  afterAll(async () => {
    await a11yTester.teardown();
  });

  describe("Public Pages", () => {
    test("homepage should be accessible", async () => {
      const results = await a11yTester.runAccessibilityTests(
        "http://localhost:3000/",
        { tags: ["wcag2a", "wcag2aa"] }
      );

      expect(results.violations).toHaveLength(0);

      if (results.violations.length > 0) {
        console.log(
          "Accessibility violations:",
          a11yTester.formatViolations(results.violations)
        );
      }
    });

    test("login page should be accessible", async () => {
      const results = await a11yTester.runAccessibilityTests(
        "http://localhost:3000/auth/login",
        { tags: ["wcag2a", "wcag2aa"] }
      );

      expect(results.violations).toHaveLength(0);
    });

    test("signup page should be accessible", async () => {
      const results = await a11yTester.runAccessibilityTests(
        "http://localhost:3000/auth/signup",
        { tags: ["wcag2a", "wcag2aa"] }
      );

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Authenticated Pages", () => {
    beforeEach(async () => {
      // Set authentication cookie
      await a11yTester.page.setCookie({
        name: "token",
        value: authToken,
        domain: "localhost",
      });
    });

    test("dashboard should be accessible", async () => {
      const results = await a11yTester.runAccessibilityTests(
        "http://localhost:3000/dashboard",
        { tags: ["wcag2a", "wcag2aa"] }
      );

      expect(results.violations).toHaveLength(0);
    });

    test("events page should be accessible", async () => {
      const results = await a11yTester.runAccessibilityTests(
        "http://localhost:3000/events",
        { tags: ["wcag2a", "wcag2aa"] }
      );

      expect(results.violations).toHaveLength(0);
    });

    test("create event form should be accessible", async () => {
      const results = await a11yTester.runAccessibilityTests(
        "http://localhost:3000/events/create",
        { tags: ["wcag2a", "wcag2aa"] }
      );

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Form Accessibility", () => {
    test("forms should have proper labels and structure", async () => {
      const results = await a11yTester.runAccessibilityTests(
        "http://localhost:3000/auth/login",
        {
          tags: ["wcag2a", "wcag2aa"],
          include: ["form", "input", "label", "button"],
        }
      );

      expect(results.violations).toHaveLength(0);
    });

    test("error messages should be accessible", async () => {
      await a11yTester.page.goto("http://localhost:3000/auth/login");

      // Trigger validation errors
      await a11yTester.page.click("button[type='submit']");
      await a11yTester.page.waitForSelector(".error-message", {
        timeout: 5000,
      });

      const results = await a11yTester.runAccessibilityTests(
        a11yTester.page.url(),
        { tags: ["wcag2a", "wcag2aa"] }
      );

      expect(results.violations).toHaveLength(0);
    });
  });
});
```

### 3. Keyboard Navigation Testing

```javascript
// tests/accessibility/keyboard.a11y.test.js
import AccessibilityTester from "./setup.js";

describe("Keyboard Navigation Tests", () => {
  let a11yTester;

  beforeAll(async () => {
    a11yTester = new AccessibilityTester();
    await a11yTester.setup();
  });

  afterAll(async () => {
    await a11yTester.teardown();
  });

  test("should navigate login form with keyboard", async () => {
    await a11yTester.page.goto("http://localhost:3000/auth/login");

    // Tab through form elements
    await a11yTester.page.keyboard.press("Tab"); // Email field
    let activeElement = await a11yTester.page.evaluate(() =>
      document.activeElement.getAttribute("name")
    );
    expect(activeElement).toBe("email");

    await a11yTester.page.keyboard.press("Tab"); // Password field
    activeElement = await a11yTester.page.evaluate(() =>
      document.activeElement.getAttribute("name")
    );
    expect(activeElement).toBe("password");

    await a11yTester.page.keyboard.press("Tab"); // Submit button
    activeElement = await a11yTester.page.evaluate(() =>
      document.activeElement.getAttribute("type")
    );
    expect(activeElement).toBe("submit");
  });

  test("should navigate main navigation with keyboard", async () => {
    await a11yTester.page.goto("http://localhost:3000/");

    // Focus first navigation item
    await a11yTester.page.focus("nav a:first-child");

    const navItems = await a11yTester.page.$$eval("nav a", (links) =>
      links.map((link) => link.textContent.trim())
    );

    for (let i = 0; i < navItems.length; i++) {
      const activeText = await a11yTester.page.evaluate(() =>
        document.activeElement.textContent.trim()
      );
      expect(navItems).toContain(activeText);

      if (i < navItems.length - 1) {
        await a11yTester.page.keyboard.press("Tab");
      }
    }
  });
});
```

## Security Testing

Security testing ensures the application is protected against common vulnerabilities and follows security best practices.

### 1. Authentication Security Tests

```javascript
// tests/security/auth.security.test.js
import request from "supertest";
import app from "../../app.js";
import { createTestUser } from "../utils/testHelpers.js";

describe("Authentication Security Tests", () => {
  describe("Password Security", () => {
    test("should reject weak passwords", async () => {
      const weakPasswords = ["123", "password", "admin", "qwerty"];

      for (const password of weakPasswords) {
        const response = await request(app).post("/api/auth/signup").send({
          username: "testuser",
          email: "test@example.com",
          password: password,
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("password");
      }
    });

    test("should enforce password complexity", async () => {
      const response = await request(app).post("/api/auth/signup").send({
        username: "testuser",
        email: "test@example.com",
        password: "weak",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/password.*requirements/i);
    });

    test("should hash passwords properly", async () => {
      const user = await createTestUser();

      // Password should be hashed, not plain text
      expect(user.password).not.toBe("TestPass123!");
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe("Rate Limiting", () => {
    test("should rate limit login attempts", async () => {
      const email = "test@example.com";
      const password = "wrongpassword";

      // Make multiple failed login attempts
      const promises = Array.from({ length: 10 }, () =>
        request(app).post("/api/auth/login").send({ email, password })
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test("should rate limit signup attempts", async () => {
      const promises = Array.from({ length: 15 }, (_, i) =>
        request(app)
          .post("/api/auth/signup")
          .send({
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: "TestPass123!",
          })
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("JWT Security", () => {
    test("should reject invalid JWT tokens", async () => {
      const invalidTokens = [
        "invalid.token.here",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
        "",
        "Bearer ",
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get("/api/user/profile")
          .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    test("should reject expired JWT tokens", async () => {
      // This would require setting up a test with an expired token
      // Implementation depends on your JWT library and setup
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid";

      const response = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });
});
```

### 2. Input Validation & XSS Prevention

```javascript
// tests/security/input-validation.security.test.js
import request from "supertest";
import app from "../../app.js";
import { createTestUser, createAuthToken } from "../utils/testHelpers.js";

describe("Input Validation Security Tests", () => {
  let authToken;
  let user;
  beforeAll(async () => {
    user = await createTestUser({ role: "moderator" });
    authToken = createAuthToken(user);
  });

  describe("XSS Prevention", () => {
    const xssPayloads = [
      "<script>alert('xss')</script>",
      "<img src='x' onerror='alert(1)'>",
      "javascript:alert('xss')",
      "<svg onload=alert('xss')>",
      "';alert('xss');//",
    ];

    test("should prevent XSS in event creation", async () => {
      for (const payload of xssPayloads) {
        const response = await request(app)
          .post("/api/events")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            title: payload,
            description: payload,
            date: new Date(),
            location: payload,
            capacity: 50,
          });

        // Should either reject the input or sanitize it
        if (response.status === 201) {
          expect(response.body.event.title).not.toContain("<script");
          expect(response.body.event.description).not.toContain("<script");
          expect(response.body.event.location).not.toContain("<script");
        } else {
          expect(response.status).toBe(400);
        }
      }
    });

    test("should prevent XSS in user profile updates", async () => {
      for (const payload of xssPayloads) {
        const response = await request(app)
          .put("/api/user/profile")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            username: payload,
            bio: payload,
          });

        if (response.status === 200) {
          expect(response.body.user.username).not.toContain("<script");
          expect(response.body.user.bio).not.toContain("<script");
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe("SQL Injection Prevention", () => {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1'; UPDATE users SET role='admin' WHERE id=1; --",
      "1' UNION SELECT * FROM users --",
    ];

    test("should prevent SQL injection in search queries", async () => {
      for (const payload of sqlPayloads) {
        const response = await request(app)
          .get(`/api/events/search?q=${encodeURIComponent(payload)}`)
          .set("Authorization", `Bearer ${authToken}`);

        // Should not return database error or unauthorized data
        expect(response.status).not.toBe(500);
        if (response.status === 200) {
          expect(response.body).toHaveProperty("events");
          expect(Array.isArray(response.body.events)).toBe(true);
        }
      }
    });
  });

  describe("NoSQL Injection Prevention", () => {
    const nosqlPayloads = [
      { $ne: null },
      { $gt: "" },
      { $regex: ".*" },
      { $where: "function() { return true; }" },
    ];

    test("should prevent NoSQL injection in user queries", async () => {
      for (const payload of nosqlPayloads) {
        const response = await request(app).post("/api/auth/login").send({
          email: payload,
          password: "anypassword",
        });

        // Should not bypass authentication
        expect(response.status).toBe(400);
      }
    });
  });
});
```

### 3. Authorization & Access Control Tests

```javascript
// tests/security/authorization.security.test.js
import request from "supertest";
import app from "../../app.js";
import { createTestUser, createAuthToken } from "../utils/testHelpers.js";

describe("Authorization Security Tests", () => {
  let normalUser, moderator, admin;
  let normalToken, moderatorToken, adminToken;

  beforeAll(async () => {
    normalUser = await createTestUser({ role: "user" });
    moderator = await createTestUser({ role: "moderator" });
    admin = await createTestUser({ role: "admin" });
    normalToken = createAuthToken(normalUser);
    moderatorToken = createAuthToken(moderator);
    adminToken = createAuthToken(admin);
  });

  describe("Role-based Access Control", () => {
    test("normal users should not access admin endpoints", async () => {
      const adminEndpoints = [
        "/api/admin/users",
        "/api/admin/stats",
        "/api/admin/system",
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set("Authorization", `Bearer ${normalToken}`);

        expect(response.status).toBe(403);
      }
    });

    test("moderators should not access admin-only endpoints", async () => {
      const response = await request(app)
        .delete("/api/admin/users/123")
        .set("Authorization", `Bearer ${moderatorToken}`);

      expect(response.status).toBe(403);
    });

    test("users should not access other users' private data", async () => {
      const otherUser = await createTestUser();

      const response = await request(app)
        .get(`/api/user/${otherUser._id}/private`)
        .set("Authorization", `Bearer ${normalToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Resource Ownership", () => {
    test("users should only edit their own events", async () => {
      // Create event as moderator
      const eventResponse = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${moderatorToken}`)
        .send({
          title: "Test Event",
          description: "Test Description",
          date: new Date(),
          location: "Test Location",
          capacity: 50,
        });

      expect(eventResponse.status).toBe(201);
      const eventId = eventResponse.body.event._id;

      // Try to edit as normal user
      const editResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${normalToken}`)
        .send({
          title: "Hacked Event",
        });

      expect(editResponse.status).toBe(403);
    });
  });
});
```

### 4. Security Headers Testing

```javascript
// tests/security/headers.security.test.js
import request from "supertest";
import app from "../../app.js";

describe("Security Headers Tests", () => {
  test("should include security headers", async () => {
    const response = await request(app).get("/");

    // Check for important security headers
    expect(response.headers).toHaveProperty("x-content-type-options");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");

    expect(response.headers).toHaveProperty("x-frame-options");
    expect(response.headers["x-frame-options"]).toBe("DENY");

    expect(response.headers).toHaveProperty("x-xss-protection");
    expect(response.headers["x-xss-protection"]).toBe("1; mode=block");

    expect(response.headers).toHaveProperty("strict-transport-security");

    // Check for CSP header
    expect(response.headers).toHaveProperty("content-security-policy");
  });

  test("should not expose sensitive server information", async () => {
    const response = await request(app).get("/");

    // Should not expose server version
    expect(response.headers["x-powered-by"]).toBeUndefined();

    // Should not expose detailed server information
    if (response.headers.server) {
      expect(response.headers.server).not.toMatch(/express/i);
      expect(response.headers.server).not.toMatch(/node/i);
    }
  });
});
```

## Test Scripts & Automation

### 1. Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:performance": "jest tests/performance",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### 2. GitHub Actions CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          JWT_SECRET: test-secret
          MONGODB_URI: mongodb://localhost:27017/test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: test
          TEST_BASE_URL: http://localhost:3000

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

## Best Practices & Guidelines

### 1. Test Organization

- Group tests by functionality (models, routes, middleware)
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated
- Use factories for test data creation

### 2. Mocking & Stubbing

```javascript
// Mock external services
jest.mock("nodemailer", () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
  })),
}));

// Mock file uploads
jest.mock("cloudinary", () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: "https://test-url.com/image.jpg",
      public_id: "test-public-id",
    }),
  },
}));
```

### 3. Test Data Management

- Use separate test database
- Clean up data between tests
- Use factories for consistent test data
- Avoid hardcoded values where possible

### 4. Coverage Goals

- Aim for 70%+ code coverage
- Focus on critical paths and edge cases
- Don't chase 100% coverage at the expense of test quality
- Monitor coverage trends over time

## Troubleshooting

### Common Test Issues

1. **Database connection errors**: Ensure MongoDB is running and accessible
2. **Timeout issues**: Increase Jest timeout for long-running tests
3. **Authentication failures**: Check JWT secret configuration
4. **File upload tests**: Mock Cloudinary service properly
5. **Race conditions**: Use proper async/await patterns

### Debugging Tests

```javascript
// Enable debugging
import debug from "debug";
const debugLogger = debug("app:test");

// Add logging to tests
test("should create user", async () => {
  debugLogger("Creating test user...");
  const user = await createTestUser();
  debugLogger("User created:", user.username);
  // ... rest of test
});
```

---

## Related Documentation

- [Developer Setup](DEVELOPER_SETUP.md)
- [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
- [Authentication & Security](AUTHENTICATION_SECURITY.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
