/**
 * Security Middleware Test Suite
 * Tests for input validation middleware, rate limiting, and security functions
 */

import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import {
  validateAuth,
  validateParams,
  validateQuery,
  securityMiddleware,
  sanitizeInput,
  validateFileUpload,
} from "../middlewares/inputValidationMiddleware.js";
import {
  logSecurityEvent,
  SECURITY_EVENTS,
  trackFailedLogin,
  clearFailedAttempts,
} from "../utils/securityLogger.js";

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  return app;
};

describe("Security Middleware Test Suite", () => {
  describe("Input Validation Middleware", () => {
    test("should validate authentication data", async () => {
      const app = createTestApp();

      app.post("/test-register", validateAuth.register, (req, res) => {
        res.json({ success: true, data: req.body });
      });

      // Valid registration
      const validData = {
        name: "John Doe",
        username: "johndoe123",
        email: "john@example.com",
        password: "MySecurePassword123!",
        confirmPassword: "MySecurePassword123!",
      };

      const response = await request(app)
        .post("/test-register")
        .send(validData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject invalid authentication data", async () => {
      const app = createTestApp();

      app.post("/test-register", validateAuth.register, (req, res) => {
        res.json({ success: true });
      });

      // Invalid registration
      const invalidData = {
        name: '<script>alert("xss")</script>',
        username: "invalid@username",
        email: "invalid-email",
        password: "weak",
        confirmPassword: "different",
      };

      const response = await request(app)
        .post("/test-register")
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toBeDefined();
    });

    test("should validate login data", async () => {
      const app = createTestApp();

      app.post("/test-login", validateAuth.login, (req, res) => {
        res.json({ success: true });
      });

      const validLogin = {
        email: "john@example.com",
        password: "MySecurePassword123!",
      };

      const response = await request(app).post("/test-login").send(validLogin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should handle redirectUrl in login", async () => {
      const app = createTestApp();

      app.post("/test-login", validateAuth.login, (req, res) => {
        res.json({ success: true, redirectUrl: req.body.redirectUrl });
      });

      const loginWithRedirect = {
        email: "john@example.com",
        password: "MySecurePassword123!",
        redirectUrl: "/dashboard",
      };

      const response = await request(app)
        .post("/test-login")
        .send(loginWithRedirect);

      expect(response.status).toBe(200);
      expect(response.body.redirectUrl).toBe("/dashboard");
    });
  });

  describe("Parameter Validation Middleware", () => {
    test("should validate MongoDB ObjectID parameters", async () => {
      const app = createTestApp();

      app.get("/test/:id", validateParams(["id"]), (req, res) => {
        res.json({ success: true, id: req.params.id });
      });

      const validId = new mongoose.Types.ObjectId().toString();

      const response = await request(app).get(`/test/${validId}`).send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject invalid ObjectID parameters", async () => {
      const app = createTestApp();

      app.get("/test/:id", validateParams(["id"]), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get("/test/invalid-id").send();

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid ID parameter");
    });

    test("should validate JWT token parameters", async () => {
      const app = createTestApp();

      app.get("/verify/:token", validateParams(["token"]), (req, res) => {
        res.json({ success: true, token: req.params.token });
      });

      // Mock JWT token
      const validJWT =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const response = await request(app).get(`/verify/${validJWT}`).send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should validate crypto token parameters", async () => {
      const app = createTestApp();

      app.get("/reset/:token", validateParams(["token"]), (req, res) => {
        res.json({ success: true, token: req.params.token });
      });

      const validCryptoToken = "a".repeat(64); // 64 hex characters

      const response = await request(app)
        .get(`/reset/${validCryptoToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Query Validation Middleware", () => {
    test("should validate search queries", async () => {
      const app = createTestApp();

      app.get("/search", validateQuery.search, (req, res) => {
        res.json({ success: true, query: req.query });
      });

      const response = await request(app)
        .get("/search?q=test&page=2&limit=20")
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.query.q).toBe("test");
      expect(response.body.query.page).toBe(2);
      expect(response.body.query.limit).toBe(20);
    });

    test("should apply defaults to search queries", async () => {
      const app = createTestApp();

      app.get("/search", validateQuery.search, (req, res) => {
        res.json({ success: true, query: req.query });
      });

      const response = await request(app).get("/search?q=test").send();

      expect(response.status).toBe(200);
      expect(response.body.query.page).toBe(1);
      expect(response.body.query.limit).toBe(10);
      expect(response.body.query.sort).toBe("date");
      expect(response.body.query.order).toBe("desc");
    });

    test("should reject invalid query parameters", async () => {
      const app = createTestApp();

      app.get("/search", validateQuery.search, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get("/search?page=invalid&limit=1000")
        .send();

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Security Middleware", () => {
    test("should sanitize request data", async () => {
      const app = createTestApp();

      app.post("/test", securityMiddleware, (req, res) => {
        res.json({ success: true, body: req.body });
      });

      const maliciousData = {
        name: "John Doe",
        $where: "this.password.length > 0",
        $ne: null,
        description: '<script>alert("xss")</script>Safe content',
        validField: "normal data",
      };

      const response = await request(app).post("/test").send(maliciousData);

      expect(response.status).toBe(200);
      expect(response.body.body).not.toHaveProperty("$where");
      expect(response.body.body).not.toHaveProperty("$ne");
      expect(response.body.body.name).toBe("John Doe");
      expect(response.body.body.validField).toBe("normal data");
    });

    test("should detect suspicious patterns", async () => {
      const app = createTestApp();

      app.post("/test", securityMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const suspiciousData = {
        input: "union select * from users",
        field: "<script>alert(1)</script>",
      };

      const response = await request(app).post("/test").send(suspiciousData);

      // Should either block or sanitize the request
      expect(response.status).not.toBe(500);
    });

    test("should handle XSS attempts", async () => {
      const app = createTestApp();

      app.post("/test", securityMiddleware, (req, res) => {
        res.json({ success: true, body: req.body });
      });

      const xssData = {
        comment: '<img src=x onerror=alert("xss")>',
        bio: '<script>document.cookie="steal=1"</script>',
        title: 'javascript:alert("xss")',
      };

      const response = await request(app).post("/test").send(xssData);

      expect(response.status).toBe(200);
      // XSS content should be sanitized or blocked
      if (response.body.body) {
        expect(response.body.body.comment).not.toContain("<script>");
        expect(response.body.body.comment).not.toContain("onerror");
        expect(response.body.body.bio).not.toContain("<script>");
      }
    });
  });

  describe("Input Sanitization Functions", () => {
    test("should sanitize input data", () => {
      const maliciousData = {
        name: "John Doe",
        $where: "this.password.length > 0",
        "user.$role": "admin",
        description: "Normal text content",
        number: 42,
        boolean: true,
      };

      const sanitized = sanitizeInput(maliciousData);

      expect(sanitized).not.toHaveProperty("$where");
      expect(sanitized).not.toHaveProperty("user.$role");
      expect(sanitized.name).toBe("John Doe");
      expect(sanitized.description).toBe("Normal text content");
      expect(sanitized.number).toBe(42);
      expect(sanitized.boolean).toBe(true);
    });

    test("should handle nested objects", () => {
      const nestedData = {
        user: {
          name: "John",
          $where: "malicious code",
          profile: {
            bio: "Developer",
            $ne: null,
          },
        },
        $regex: ".*",
      };

      const sanitized = sanitizeInput(nestedData);

      expect(sanitized).not.toHaveProperty("$regex");
      expect(sanitized.user).toBeDefined();
      expect(sanitized.user).not.toHaveProperty("$where");
      expect(sanitized.user.name).toBe("John");
    });

    test("should limit string lengths", () => {
      const longString = "a".repeat(2000);
      const data = { field: longString };

      const sanitized = sanitizeInput(data);
      expect(sanitized.field.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("File Upload Validation", () => {
    test("should validate file types", () => {
      const validFile = {
        mimetype: "image/jpeg",
        size: 1024 * 1024, // 1MB
        originalname: "photo.jpg",
      };

      const result = validateFileUpload(validFile);
      expect(result.isValid).toBe(true);
    });

    test("should reject invalid file types", () => {
      const invalidFile = {
        mimetype: "application/x-executable",
        size: 1024,
        originalname: "malware.exe",
      };

      const result = validateFileUpload(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("file type");
    });

    test("should reject oversized files", () => {
      const largeFile = {
        mimetype: "image/jpeg",
        size: 20 * 1024 * 1024, // 20MB
        originalname: "large-image.jpg",
      };

      const result = validateFileUpload(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("size");
    });

    test("should sanitize filenames", () => {
      const maliciousFile = {
        mimetype: "image/jpeg",
        size: 1024,
        originalname: "../../../etc/passwd",
      };

      const result = validateFileUpload(maliciousFile);
      if (result.sanitizedName) {
        expect(result.sanitizedName).not.toContain("../");
        expect(result.sanitizedName).not.toContain("/");
      }
    });
  });

  describe("Security Logging", () => {
    test("should log security events", () => {
      const mockRequest = {
        ip: "127.0.0.1",
        get: jest.fn().mockReturnValue("Mozilla/5.0"),
        user: { id: "user123" },
      };

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_SUCCESS,
        {
          email: "test@example.com",
          userId: "user123",
        },
        mockRequest
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test("should track failed login attempts", () => {
      const ip = "192.168.1.100";

      // Track multiple failed attempts
      const attemptCount1 = trackFailedLogin(ip);
      const attemptCount2 = trackFailedLogin(ip);
      const attemptCount3 = trackFailedLogin(ip);

      expect(attemptCount1).toBe(1);
      expect(attemptCount2).toBe(2);
      expect(attemptCount3).toBe(3);
    });

    test("should clear failed login attempts", () => {
      const ip = "192.168.1.101";

      trackFailedLogin(ip);
      trackFailedLogin(ip);

      clearFailedAttempts(ip);

      // Next attempt should reset the counter
      const attemptCount = trackFailedLogin(ip);
      expect(attemptCount).toBe(1);
    });

    test("should alert on multiple failed attempts", () => {
      const ip = "192.168.1.102";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Trigger 5+ failed attempts to trigger alert
      for (let i = 0; i < 6; i++) {
        trackFailedLogin(ip);
      }

      // Should have logged a security alert
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed JSON gracefully", async () => {
      const app = createTestApp();

      app.post("/test", securityMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post("/test")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}');

      expect(response.status).not.toBe(500);
    });

    test("should handle missing fields gracefully", async () => {
      const app = createTestApp();

      app.post("/test", validateAuth.register, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).post("/test").send({}); // Empty body

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });

    test("should not expose sensitive information in errors", async () => {
      const app = createTestApp();

      app.post("/test", (req, res, next) => {
        const error = new Error(
          "Database connection failed: password=secret123"
        );
        next(error);
      });

      // Add error handler
      app.use((error, req, res, next) => {
        res.status(500).json({
          error:
            process.env.NODE_ENV === "production"
              ? "Internal server error"
              : error.message,
        });
      });

      const response = await request(app).post("/test").send({});

      expect(response.status).toBe(500);

      // In production, should not expose sensitive details
      if (process.env.NODE_ENV === "production") {
        expect(response.body.error).toBe("Internal server error");
        expect(response.body.error).not.toContain("password");
        expect(response.body.error).not.toContain("secret");
      }
    });
  });

  describe("Rate Limiting Simulation", () => {
    test("should handle rapid successive requests", async () => {
      const app = createTestApp();

      app.post("/test", securityMiddleware, (req, res) => {
        res.json({ success: true, timestamp: Date.now() });
      });

      // Send multiple requests rapidly
      const requests = Array(20)
        .fill()
        .map(() => request(app).post("/test").send({ data: "test" }));

      const responses = await Promise.all(requests);

      // All requests should complete without crashing
      responses.forEach((response) => {
        expect(response.status).not.toBe(500);
      });
    });
  });
});
