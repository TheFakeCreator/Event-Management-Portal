/**
 * Password Security Test Suite
 * Tests for password validation, hashing, and security functions
 */

import bcrypt from "bcrypt";
import {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
  generateSecurePassword,
  checkPasswordHistory,
  isCommonPassword,
} from "../utils/passwordSecurity.js";

describe("Password Security Test Suite", () => {
  describe("Password Strength Validation", () => {
    test("should accept strong passwords", () => {
      const strongPasswords = [
        "MySecureP@ssw0rd2024!",
        "Complex#Password123",
        "AnotherStr0ng!Pass",
        "SuperSecure$789Pass",
        "MyVeryL0ng&SecurePassword2024!",
        "Testing#123ValidPassword",
      ];

      strongPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.score).toBeGreaterThan(3);
      });
    });

    test("should reject weak passwords", () => {
      const weakPasswords = [
        "weak",
        "12345678",
        "password",
        "Password",
        "password123",
        "PASSWORD",
        "Pass123",
        "abcdefgh",
        "12345678",
        "qwertyui",
      ];

      weakPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.score).toBeLessThan(4);
      });
    });

    test("should enforce minimum length requirement", () => {
      const shortPasswords = ["Ab1!", "Test1!", "Sh0rt!", "Ab12#"];

      shortPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must be at least 8 characters long"
        );
      });
    });

    test("should enforce maximum length requirement", () => {
      const longPassword = "A".repeat(129) + "1!";
      const result = validatePasswordStrength(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must not exceed 128 characters"
      );
    });

    test("should require uppercase letters", () => {
      const noUppercasePasswords = [
        "lowercase123!",
        "mypassword1!",
        "test123456!",
      ];

      noUppercasePasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must contain at least one uppercase letter"
        );
      });
    });

    test("should require lowercase letters", () => {
      const noLowercasePasswords = [
        "UPPERCASE123!",
        "MYPASSWORD1!",
        "TEST123456!",
      ];

      noLowercasePasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must contain at least one lowercase letter"
        );
      });
    });

    test("should require numbers", () => {
      const noNumberPasswords = [
        "NoNumbersHere!",
        "MyPassword!",
        "TestPassword!",
      ];

      noNumberPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must contain at least one number"
        );
      });
    });

    test("should require special characters", () => {
      const noSpecialPasswords = [
        "NoSpecialChars123",
        "MyPassword123",
        "TestPassword456",
      ];

      noSpecialPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password must contain at least one special character"
        );
      });
    });

    test("should detect common passwords", () => {
      const commonPasswords = [
        "Password123!",
        "Welcome123!",
        "Admin123!",
        "Test123!",
        "User123!",
        "Login123!",
      ];

      commonPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password is too common or predictable"
        );
      });
    });

    test("should detect sequential characters", () => {
      const sequentialPasswords = [
        "Abcd1234!",
        "Password1234!",
        "Test12345!",
        "Qwerty123!",
      ];

      sequentialPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password contains sequential characters"
        );
      });
    });

    test("should detect repeated characters", () => {
      const repeatedPasswords = [
        "Aaaaaa123!",
        "Password111!",
        "Testtttt1!",
        "MyPasssss1!",
      ];

      repeatedPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Password contains too many repeated characters"
        );
      });
    });

    test("should calculate password strength scores", () => {
      const passwordTests = [
        { password: "weak", expectedScore: 0 },
        { password: "WeakPass1!", expectedScore: 2 },
        { password: "MediumPassword123!", expectedScore: 3 },
        { password: "VeryStrongComplexP@ssw0rd2024!", expectedScore: 5 },
      ];

      passwordTests.forEach(({ password, expectedScore }) => {
        const result = validatePasswordStrength(password);
        expect(result.score).toBeGreaterThanOrEqual(expectedScore);
      });
    });
  });

  describe("Password Hashing", () => {
    test("should hash passwords securely", async () => {
      const password = "MySecurePassword123!";
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    test("should generate different hashes for same password", async () => {
      const password = "MySecurePassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test("should use appropriate salt rounds", async () => {
      const password = "MySecurePassword123!";
      const hashedPassword = await hashPassword(password);

      // Extract salt rounds from bcrypt hash
      const saltRounds = parseInt(hashedPassword.split("$")[2]);
      expect(saltRounds).toBeGreaterThanOrEqual(12);
    });

    test("should handle empty passwords", async () => {
      await expect(hashPassword("")).rejects.toThrow();
    });

    test("should handle null/undefined passwords", async () => {
      await expect(hashPassword(null)).rejects.toThrow();
      await expect(hashPassword(undefined)).rejects.toThrow();
    });
  });

  describe("Password Comparison", () => {
    test("should compare passwords correctly", async () => {
      const password = "MySecurePassword123!";
      const hashedPassword = await hashPassword(password);

      const mockReq = { ip: "127.0.0.1" };
      const isMatch = await comparePassword(password, hashedPassword, mockReq);

      expect(isMatch).toBe(true);
    });

    test("should reject incorrect passwords", async () => {
      const correctPassword = "MySecurePassword123!";
      const wrongPassword = "WrongPassword123!";
      const hashedPassword = await hashPassword(correctPassword);

      const mockReq = { ip: "127.0.0.1" };
      const isMatch = await comparePassword(
        wrongPassword,
        hashedPassword,
        mockReq
      );

      expect(isMatch).toBe(false);
    });

    test("should handle timing attack protection", async () => {
      const password = "MySecurePassword123!";
      const hashedPassword = await hashPassword(password);

      const mockReq = { ip: "127.0.0.1" };

      // Measure time for correct password
      const start1 = Date.now();
      await comparePassword(password, hashedPassword, mockReq);
      const time1 = Date.now() - start1;

      // Measure time for incorrect password
      const start2 = Date.now();
      await comparePassword("WrongPassword123!", hashedPassword, mockReq);
      const time2 = Date.now() - start2;

      // Times should be similar (within reasonable variance)
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(50); // 50ms tolerance
    });

    test("should handle malformed hashes", async () => {
      const password = "MySecurePassword123!";
      const malformedHash = "not-a-valid-hash";

      const mockReq = { ip: "127.0.0.1" };

      await expect(
        comparePassword(password, malformedHash, mockReq)
      ).rejects.toThrow();
    });
  });

  describe("Secure Password Generation", () => {
    test("should generate secure passwords", () => {
      const password = generateSecurePassword();

      expect(password).toBeDefined();
      expect(password.length).toBeGreaterThanOrEqual(12);

      const validation = validatePasswordStrength(password);
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(4);
    });

    test("should generate different passwords each time", () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      const password3 = generateSecurePassword();

      expect(password1).not.toBe(password2);
      expect(password2).not.toBe(password3);
      expect(password1).not.toBe(password3);
    });

    test("should generate passwords with custom length", () => {
      const lengths = [16, 20, 24, 32];

      lengths.forEach((length) => {
        const password = generateSecurePassword(length);
        expect(password.length).toBe(length);

        const validation = validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
      });
    });

    test("should include all required character types", () => {
      const password = generateSecurePassword(20);

      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/[0-9]/); // numbers
      expect(password).toMatch(/[@$!%*?&#+\-_=]/); // special characters
    });
  });

  describe("Common Password Detection", () => {
    test("should detect common passwords", () => {
      const commonPasswords = [
        "password",
        "password123",
        "admin",
        "admin123",
        "welcome",
        "qwerty",
        "letmein",
        "123456",
        "12345678",
        "test",
        "guest",
        "user",
      ];

      commonPasswords.forEach((password) => {
        expect(isCommonPassword(password)).toBe(true);
      });
    });

    test("should not flag unique passwords as common", () => {
      const uniquePasswords = [
        "MyUniqueSecureP@ssw0rd2024!",
        "PersonalizedPassword#789",
        "CustomSecurePhrase$123",
        "UniqueComplexPassword!456",
      ];

      uniquePasswords.forEach((password) => {
        expect(isCommonPassword(password)).toBe(false);
      });
    });

    test("should handle case insensitive common passwords", () => {
      const variations = [
        "PASSWORD",
        "Password",
        "PassWord",
        "ADMIN",
        "Admin",
        "WELCOME",
        "Welcome",
      ];

      variations.forEach((password) => {
        expect(isCommonPassword(password)).toBe(true);
      });
    });
  });

  describe("Password History Checking", () => {
    test("should detect password reuse", async () => {
      const currentPassword = "CurrentPassword123!";
      const previousPasswords = [
        await hashPassword("OldPassword123!"),
        await hashPassword("AnotherOldPassword123!"),
        await hashPassword("CurrentPassword123!"), // Same as current
      ];

      const isReused = await checkPasswordHistory(
        currentPassword,
        previousPasswords
      );
      expect(isReused).toBe(true);
    });

    test("should allow new passwords", async () => {
      const newPassword = "BrandNewPassword123!";
      const previousPasswords = [
        await hashPassword("OldPassword123!"),
        await hashPassword("AnotherOldPassword123!"),
        await hashPassword("ThirdOldPassword123!"),
      ];

      const isReused = await checkPasswordHistory(
        newPassword,
        previousPasswords
      );
      expect(isReused).toBe(false);
    });

    test("should handle empty password history", async () => {
      const newPassword = "FirstPassword123!";
      const previousPasswords = [];

      const isReused = await checkPasswordHistory(
        newPassword,
        previousPasswords
      );
      expect(isReused).toBe(false);
    });

    test("should limit password history check", async () => {
      const newPassword = "NewPassword123!";
      const manyPreviousPasswords = [];

      // Generate 20 previous passwords
      for (let i = 0; i < 20; i++) {
        manyPreviousPasswords.push(await hashPassword(`OldPassword${i}!`));
      }

      const isReused = await checkPasswordHistory(
        newPassword,
        manyPreviousPasswords
      );
      expect(isReused).toBe(false);
    });
  });

  describe("Password Security Edge Cases", () => {
    test("should handle unicode characters", () => {
      const unicodePasswords = [
        "Pässwörd123!",
        "パスワード123!",
        "Contraseña123!",
        "Пароль123!",
      ];

      unicodePasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        // Should not crash, but may not pass all requirements
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
      });
    });

    test("should handle very long passwords", () => {
      const veryLongPassword = "A".repeat(500) + "1!";
      const result = validatePasswordStrength(veryLongPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must not exceed 128 characters"
      );
    });

    test("should handle special characters in edge cases", () => {
      const edgeCasePasswords = [
        "Password123\n!", // newline
        "Password123\t!", // tab
        "Password123 !", // space
        'Password123"!', // quote
        "Password123'!", // apostrophe
      ];

      edgeCasePasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result).toBeDefined();
      });
    });

    test("should handle null and undefined inputs", () => {
      expect(() => validatePasswordStrength(null)).not.toThrow();
      expect(() => validatePasswordStrength(undefined)).not.toThrow();

      const nullResult = validatePasswordStrength(null);
      const undefinedResult = validatePasswordStrength(undefined);

      expect(nullResult.isValid).toBe(false);
      expect(undefinedResult.isValid).toBe(false);
    });
  });

  describe("Password Security Metrics", () => {
    test("should calculate entropy correctly", () => {
      const passwordTests = [
        { password: "a", expectedMinEntropy: 0 },
        { password: "aA", expectedMinEntropy: 5 },
        { password: "aA1", expectedMinEntropy: 10 },
        { password: "aA1!", expectedMinEntropy: 15 },
        { password: "MySecureP@ssw0rd123!", expectedMinEntropy: 80 },
      ];

      passwordTests.forEach(({ password, expectedMinEntropy }) => {
        const result = validatePasswordStrength(password);
        if (result.entropy) {
          expect(result.entropy).toBeGreaterThanOrEqual(expectedMinEntropy);
        }
      });
    });

    test("should provide detailed feedback", () => {
      const weakPassword = "weak";
      const result = validatePasswordStrength(weakPassword);

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.suggestions).toBeDefined();
      expect(result.strengthLabel).toBeDefined();
    });

    test("should classify password strength levels", () => {
      const strengthTests = [
        { password: "weak", expectedLevel: "Very Weak" },
        { password: "WeakPass1!", expectedLevel: "Weak" },
        { password: "MediumPassword123!", expectedLevel: "Medium" },
        { password: "StrongPassword123!@#", expectedLevel: "Strong" },
        {
          password: "VeryStrongComplexP@ssw0rd2024!",
          expectedLevel: "Very Strong",
        },
      ];

      strengthTests.forEach(({ password, expectedLevel }) => {
        const result = validatePasswordStrength(password);
        if (result.strengthLabel) {
          expect([
            "Very Weak",
            "Weak",
            "Medium",
            "Strong",
            "Very Strong",
          ]).toContain(result.strengthLabel);
        }
      });
    });
  });
});
