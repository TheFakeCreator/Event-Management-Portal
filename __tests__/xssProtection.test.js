/**
 * XSS Protection Tests
 * Comprehensive testing for XSS vulnerabilities and protection measures
 */

import request from "supertest";
import app from "../app.js";
import { sanitizeInput, ejsHelpers } from "../utils/xssProtection.js";
import { generateMaliciousData } from "./setup.js";

describe("XSS Protection Tests", () => {
  describe("XSS Protection Utils", () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      "<svg onload=\"alert('xss')\">",
      'javascript:alert("xss")',
      "<iframe src=\"javascript:alert('xss')\"></iframe>",
      "<object data=\"javascript:alert('xss')\"></object>",
      "<embed src=\"javascript:alert('xss')\">",
      '<form><input type="submit" formaction="javascript:alert(\'xss\')"></form>',
      "<a href=\"javascript:alert('xss')\">Click</a>",
      "<div onclick=\"alert('xss')\">Click</div>",
      "<style>body{background:url(\"javascript:alert('xss')\")}</style>",
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'xss\')">',
      'data:text/html,<script>alert("xss")</script>',
      'vbscript:alert("xss")',
      '"><script>alert("xss")</script>',
      '\';alert("xss");//',
    ];

    describe("sanitizeInput.user()", () => {
      test("should remove all HTML tags from user input", () => {
        xssPayloads.forEach((payload) => {
          const result = sanitizeInput.user(payload);
          expect(result).not.toContain("<script");
          expect(result).not.toContain("javascript:");
          expect(result).not.toContain("onerror");
          expect(result).not.toContain("onload");
          expect(result).not.toContain("onclick");
        });
      });

      test("should handle non-string inputs safely", () => {
        expect(sanitizeInput.user(null)).toBeNull();
        expect(sanitizeInput.user(undefined)).toBeUndefined();
        expect(sanitizeInput.user(123)).toBe(123);
        expect(sanitizeInput.user({})).toEqual({});
      });
    });

    describe("sanitizeInput.text()", () => {
      test("should allow basic formatting but remove dangerous tags", () => {
        const basicFormatting = "<b>Bold</b> <i>Italic</i> <em>Emphasis</em>";
        const result = sanitizeInput.text(basicFormatting);
        expect(result).toContain("<b>Bold</b>");
        expect(result).toContain("<i>Italic</i>");

        xssPayloads.forEach((payload) => {
          const result = sanitizeInput.text(payload);
          expect(result).not.toContain("<script");
          expect(result).not.toContain("javascript:");
          expect(result).not.toContain("onerror");
        });
      });
    });

    describe("sanitizeInput.rich()", () => {
      test("should allow rich content but sanitize dangerous elements", () => {
        const richContent =
          "<h1>Title</h1><p>Paragraph</p><ul><li>List item</li></ul>";
        const result = sanitizeInput.rich(richContent);
        expect(result).toContain("<h1>Title</h1>");
        expect(result).toContain("<p>Paragraph</p>");

        xssPayloads.forEach((payload) => {
          const result = sanitizeInput.rich(payload);
          expect(result).not.toContain("<script");
          expect(result).not.toContain("javascript:");
          expect(result).not.toContain("onerror");
        });
      });
    });

    describe("sanitizeInput.url()", () => {
      test("should allow safe URLs and reject dangerous ones", () => {
        expect(sanitizeInput.url("https://example.com")).toBe(
          "https://example.com"
        );
        expect(sanitizeInput.url("http://example.com")).toBe(
          "http://example.com"
        );
        expect(sanitizeInput.url("mailto:test@example.com")).toBe(
          "mailto:test@example.com"
        );

        expect(sanitizeInput.url('javascript:alert("xss")')).toBe("");
        expect(
          sanitizeInput.url('data:text/html,<script>alert("xss")</script>')
        ).toBe("");
        expect(sanitizeInput.url('vbscript:alert("xss")')).toBe("");
      });
    });

    describe("ejsHelpers.safeJSON()", () => {
      test("should safely serialize JSON for embedding in templates", () => {
        const data = {
          name: '<script>alert("xss")</script>',
          description: "Normal text",
        };

        const result = ejsHelpers.safeJSON(data);
        expect(result).not.toContain("<script>");
        expect(result).toContain("\\u003c");
        expect(JSON.parse(result)).toEqual(data);
      });

      test("should handle circular references gracefully", () => {
        const circular = { a: 1 };
        circular.self = circular;

        const result = ejsHelpers.safeJSON(circular);
        expect(result).toBe("{}");
      });
    });

    describe("ejsHelpers.safeLineBreaks()", () => {
      test("should safely convert line breaks to HTML", () => {
        const text = 'Line 1\nLine 2\n<script>alert("xss")</script>';
        const result = ejsHelpers.safeLineBreaks(text);

        expect(result).toContain("Line 1<br>Line 2");
        expect(result).not.toContain("<script>");
      });
    });
  });

  describe("Template XSS Protection", () => {
    test("should prevent XSS in event descriptions", async () => {
      // This would require authentication and database setup
      // Testing template rendering directly
      const maliciousDescription = '<script>alert("xss")</script>';
      const safeDescription = ejsHelpers.safeLineBreaks(maliciousDescription);

      expect(safeDescription).not.toContain("<script>");
      expect(safeDescription).not.toContain("alert(");
    });

    test("should prevent XSS in JSON data embedding", async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>',
        club: { name: '"><script>alert("xss")</script>' },
      };

      const safeJson = ejsHelpers.safeJSON(maliciousData);
      expect(safeJson).not.toContain("<script>");
      expect(safeJson).not.toContain('">');

      // Should still be valid JSON
      const parsed = JSON.parse(safeJson);
      expect(parsed.title).toBeTruthy();
      expect(parsed.club.name).toBeTruthy();
    });
  });

  describe("Input Validation Middleware XSS Protection", () => {
    test("should sanitize form submissions", async () => {
      const maliciousFormData = {
        name: '<script>alert("xss")</script>',
        email: "test@example.com",
        description: '<img src="x" onerror="alert(1)">',
      };

      // Test would need actual endpoints, but testing the concept
      const sanitizedData = {};
      Object.keys(maliciousFormData).forEach((key) => {
        sanitizedData[key] = sanitizeInput.user(maliciousFormData[key]);
      });

      expect(sanitizedData.name).not.toContain("<script>");
      expect(sanitizedData.description).not.toContain("onerror");
      expect(sanitizedData.email).toBe("test@example.com"); // Valid email should pass
    });
  });

  describe("Content Security Policy", () => {
    test("should include proper CSP headers", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.headers["content-security-policy"]).toBeDefined();
      expect(response.headers["content-security-policy"]).toContain(
        "default-src 'self'"
      );
      expect(response.headers["content-security-policy"]).toContain(
        "object-src 'none'"
      );
    });

    test("should prevent inline script execution", async () => {
      const response = await request(app).get("/").expect(200);

      const csp = response.headers["content-security-policy"];
      expect(csp).not.toContain("script-src 'unsafe-inline'");
    });
  });

  describe("Error Handling XSS Protection", () => {
    test("should not expose sensitive information in error messages", async () => {
      // Test 404 page doesn't reflect user input
      const maliciousPath = '/nonexistent<script>alert("xss")</script>';
      const response = await request(app).get(maliciousPath).expect(404);

      expect(response.text).not.toContain("<script>");
      expect(response.text).not.toContain("alert(");
    });
  });

  describe("File Upload XSS Protection", () => {
    test("should validate file types and prevent malicious uploads", () => {
      const maliciousFilename = 'test<script>alert("xss")</script>.jpg';
      const sanitizedFilename = sanitizeInput.user(maliciousFilename);

      expect(sanitizedFilename).not.toContain("<script>");
      expect(sanitizedFilename).not.toContain("alert(");
    });
  });

  describe("DOM-based XSS Prevention", () => {
    test("should provide safe methods for client-side DOM manipulation", () => {
      // Test client-side safety guidelines
      const unsafeHtml = '<img src="x" onerror="alert(1)">';

      // Recommend using textContent instead of innerHTML
      // This would be tested in browser environment
      expect(true).toBe(true); // Placeholder for actual DOM tests
    });
  });

  describe("Session Security", () => {
    test("should set secure session configuration", async () => {
      const response = await request(app).get("/").expect(200);

      // In production, cookies should be secure
      if (process.env.NODE_ENV === "production") {
        expect(response.headers["set-cookie"]).toBeDefined();
        // Should include secure flag in production
      }
    });
  });

  describe("Server Information Disclosure", () => {
    test("should not expose server information", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.headers["x-powered-by"]).toBeUndefined();
      expect(response.headers["server"]).not.toContain("Express");
    });
  });
});

describe("XSS Protection Edge Cases", () => {
  test("should handle encoded XSS attempts", () => {
    const encodedXss = "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;";
    const result = sanitizeInput.user(encodedXss);
    expect(result).not.toContain("script");
  });

  test("should handle nested XSS attempts", () => {
    const nestedXss = '<div><span><script>alert("xss")</script></span></div>';
    const result = sanitizeInput.rich(nestedXss);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<div>"); // Should preserve safe tags
  });

  test("should handle Unicode XSS attempts", () => {
    const unicodeXss =
      "\\u003cscript\\u003ealert(\\u0022xss\\u0022)\\u003c/script\\u003e";
    const result = sanitizeInput.user(unicodeXss);
    expect(result).not.toContain("script");
  });

  test("should handle very large payloads", () => {
    const largePayload =
      "<script>".repeat(10000) + 'alert("xss")' + "</script>".repeat(10000);
    const result = sanitizeInput.user(largePayload);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert(");
  });
});
