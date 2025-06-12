/**
 * Input Validation and Sanitization System
 * Prevents NoSQL injection and ensures data integrity
 * Using Joi for comprehensive validation schemas
 */

import Joi from "joi";
import mongoose from "mongoose";

/**
 * Common validation patterns and custom validators
 */
const commonValidations = {
  // MongoDB ObjectId validation
  mongoId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "MongoDB ObjectId validation")
    .messages({
      "any.invalid": "Invalid MongoDB ObjectId format",
    }),
  // Email validation
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .lowercase()
    .trim()
    .max(254)
    .messages({
      "string.email":
        "Please enter a valid email address (e.g., user@example.com)",
      "string.max": "Email address must not exceed 254 characters",
    }),
  // Password validation (matching our password security requirements)
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#+\\-_=])[A-Za-z\\d@$!%*?&#+\\-_=]"
      )
    )
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password must not exceed 128 characters",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#+\\-_=). Example: MyPass123!",
    }),

  // Username validation
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim().messages({
    "string.alphanum":
      "Username can only contain letters and numbers (e.g., user123)",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must not exceed 30 characters",
  }),

  // Name validation (prevents script injection)
  name: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .pattern(/^[a-zA-Z\s'-]+$/)
    .messages({
      "string.min": "Name is required",
      "string.max": "Name must not exceed 100 characters",
      "string.pattern.base":
        "Name can only contain letters, spaces, hyphens, and apostrophes (e.g., John Doe, Mary-Jane, O'Connor)",
    }),

  // URL validation
  url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .max(2048)
    .messages({
      "string.uri":
        "Please enter a valid URL starting with http:// or https:// (e.g., https://example.com)",
      "string.max": "URL must not exceed 2048 characters",
    }),

  // Date validation
  date: Joi.date().iso().min("1900-01-01").max("2100-12-31").messages({
    "date.base": "Please enter a valid date",
    "date.min": "Date cannot be earlier than January 1, 1900",
    "date.max": "Date cannot be later than December 31, 2100",
    "date.format": "Date must be in YYYY-MM-DD format (e.g., 2024-12-25)",
  }),

  // Phone number validation
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .messages({
      "string.pattern.base":
        "Please enter a valid phone number (e.g., +1234567890 or 9876543210)",
    }),
  // Safe text validation (prevents XSS and script injection)
  safeText: Joi.string()
    .max(10000)
    .trim()
    .pattern(/^[^<>]*$/)
    .messages({
      "string.max": "Text must not exceed 10,000 characters",
      "string.pattern.base":
        "Text cannot contain HTML tags or script content for security reasons",
    }),

  // Short text validation
  shortText: Joi.string()
    .max(255)
    .trim()
    .pattern(/^[^<>]*$/)
    .messages({
      "string.max": "Text must not exceed 255 characters",
      "string.pattern.base":
        "Text cannot contain HTML tags or script content for security reasons",
    }),
};

/**
 * Authentication validation schemas
 */
export const authValidationSchemas = {
  // User registration validation
  register: Joi.object({
    name: commonValidations.name.required(),
    username: commonValidations.username.required(),
    email: commonValidations.email.required(),
    password: commonValidations.password.required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords must match",
      }),
  }).options({ stripUnknown: true }),
  // User login validation
  login: Joi.object({
    email: commonValidations.email.required(),
    password: Joi.string().required().max(128),
    redirectUrl: Joi.string().allow("").uri({ relativeOnly: true }).optional(),
  }).options({ stripUnknown: true }), // Password reset validation (token comes from URL param, not body)
  resetPassword: Joi.object({
    newPassword: commonValidations.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }).options({ stripUnknown: true }),

  // Forgot password validation
  forgotPassword: Joi.object({
    email: commonValidations.email.required(),
  }).options({ stripUnknown: true }),
};

/**
 * User management validation schemas
 */
export const userValidationSchemas = {
  // Profile update validation
  updateProfile: Joi.object({
    name: commonValidations.name.optional(),
    username: commonValidations.username.optional(),
    phone: commonValidations.phone.optional(),
    bio: commonValidations.safeText.max(500).optional(),
    occupation: commonValidations.shortText.optional(),
    location: commonValidations.shortText.optional(),
    gender: Joi.string().valid("male", "Female", "other").optional(),
    socials: Joi.object({
      linkedin: commonValidations.url.optional(),
      github: commonValidations.url.optional(),
      behance: commonValidations.url.optional(),
    }).optional(),
  }).options({ stripUnknown: true }),

  // Role request validation
  requestRole: Joi.object({
    requestedRole: Joi.string()
      .valid("admin", "moderator", "member")
      .required(),
    clubId: commonValidations.mongoId.optional(),
  }).options({ stripUnknown: true }),
};

/**
 * Event validation schemas
 */
export const eventValidationSchemas = {
  // Create event validation
  createEvent: Joi.object({
    title: commonValidations.shortText.min(3).required(),
    description: commonValidations.safeText.min(10).required(),
    type: Joi.string()
      .valid(
        "Workshops",
        "Talks",
        "Workshops & Talks",
        "Meetups",
        "Networking",
        "Fun",
        "Tech",
        "Other"
      )
      .required(),
    startDate: commonValidations.date.required(),
    endDate: commonValidations.date.min(Joi.ref("startDate")).required(),
    startTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    endTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    location: commonValidations.shortText.required(),
    image: commonValidations.url.required(),
    club: commonValidations.mongoId.required(),
    collaborators: Joi.alternatives()
      .try(
        Joi.array().items(commonValidations.mongoId),
        Joi.string().custom((value, helpers) => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return helpers.error("any.invalid");
          }
        })
      )
      .optional(),
    eventLeads: Joi.alternatives()
      .try(
        Joi.array().items(commonValidations.mongoId),
        Joi.string().custom((value, helpers) => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return helpers.error("any.invalid");
          }
        })
      )
      .optional(),
    sponsors: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.object({
            name: commonValidations.shortText.required(),
            logo: commonValidations.url.optional(),
            description: commonValidations.safeText.optional(),
            website: commonValidations.url.optional(),
          })
        ),
        Joi.string().custom((value, helpers) => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return helpers.error("any.invalid");
          }
        })
      )
      .optional(),
  }).options({ stripUnknown: true }),

  // Update event validation
  updateEvent: Joi.object({
    title: commonValidations.shortText.min(3).optional(),
    description: commonValidations.safeText.min(10).optional(),
    type: Joi.string()
      .valid(
        "Workshops",
        "Talks",
        "Workshops & Talks",
        "Meetups",
        "Networking",
        "Fun",
        "Tech",
        "Other"
      )
      .optional(),
    startDate: commonValidations.date.optional(),
    endDate: commonValidations.date.optional(),
    startTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    endTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    location: commonValidations.shortText.optional(),
    image: commonValidations.url.optional(),
    club: commonValidations.mongoId.optional(),
    collaborators: Joi.alternatives()
      .try(Joi.array().items(commonValidations.mongoId), Joi.string())
      .optional(),
    eventLeads: Joi.alternatives()
      .try(Joi.array().items(commonValidations.mongoId), Joi.string())
      .optional(),
    sponsors: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.object({
            name: commonValidations.shortText.required(),
            logo: commonValidations.url.optional(),
            description: commonValidations.safeText.optional(),
            website: commonValidations.url.optional(),
          })
        ),
        Joi.string()
      )
      .optional(),
  }).options({ stripUnknown: true }),

  // Event registration validation
  registerEvent: Joi.object({
    name: commonValidations.name.required(),
    email: commonValidations.email.required(),
    phone: commonValidations.phone.required(),
  }).options({ stripUnknown: true }),

  // Event report validation
  reportEvent: Joi.object({
    reason: Joi.string()
      .valid(
        "inappropriate_content",
        "misleading_information",
        "unauthorized_collaboration",
        "spam",
        "other"
      )
      .required(),
    description: commonValidations.safeText.min(10).max(1000).required(),
  }).options({ stripUnknown: true }),
};

/**
 * Club validation schemas
 */
export const clubValidationSchemas = {
  // Create club validation
  createClub: Joi.object({
    name: commonValidations.shortText.min(2).required(),
    description: commonValidations.safeText.min(10).required(),
    about: commonValidations.safeText.optional(),
    image: commonValidations.url.optional(),
    banner: commonValidations.url.optional(),
    domains: Joi.alternatives()
      .try(
        Joi.array().items(commonValidations.shortText),
        commonValidations.shortText
      )
      .optional(),
    social: Joi.object({
      email: commonValidations.email.optional(),
      instagram: commonValidations.url.optional(),
      facebook: commonValidations.url.optional(),
      linkedin: commonValidations.url.optional(),
      discord: commonValidations.url.optional(),
    }).optional(),
  }).options({ stripUnknown: true }),

  // Update club validation
  updateClub: Joi.object({
    name: commonValidations.shortText.min(2).optional(),
    description: commonValidations.safeText.min(10).optional(),
    about: commonValidations.safeText.optional(),
    image: commonValidations.url.optional(),
    banner: commonValidations.url.optional(),
    domains: Joi.alternatives()
      .try(
        Joi.array().items(commonValidations.shortText),
        commonValidations.shortText
      )
      .optional(),
    social: Joi.object({
      email: commonValidations.email.optional(),
      instagram: commonValidations.url.optional(),
      facebook: commonValidations.url.optional(),
      linkedin: commonValidations.url.optional(),
      discord: commonValidations.url.optional(),
    }).optional(),
  }).options({ stripUnknown: true }),
};

/**
 * Recruitment validation schemas
 */
export const recruitmentValidationSchemas = {
  // Create recruitment validation
  createRecruitment: Joi.object({
    title: commonValidations.shortText.min(3).required(),
    description: commonValidations.safeText.min(10).required(),
    deadline: commonValidations.date.min("now").required(),
    clubId: commonValidations.mongoId.required(),
    applicationForm: Joi.alternatives()
      .try(
        Joi.array().items(
          Joi.object({
            label: commonValidations.shortText.required(),
            type: Joi.string()
              .valid("text", "textarea", "select", "radio", "checkbox")
              .required(),
            required: Joi.boolean().default(false),
            options: Joi.array().items(commonValidations.shortText).optional(),
          })
        ),
        Joi.string().custom((value, helpers) => {
          try {
            return JSON.parse(value);
          } catch {
            return helpers.error("any.invalid");
          }
        })
      )
      .optional(),
  }).options({ stripUnknown: true }),

  // Apply to recruitment validation
  applyRecruitment: Joi.object({
    name: commonValidations.name.required(),
    email: commonValidations.email.required(),
    // Custom fields will be validated dynamically based on recruitment form
  }).unknown(true), // Allow custom fields but they'll be sanitized
};

/**
 * Admin validation schemas
 */
export const adminValidationSchemas = {
  // Assign role validation
  assignRole: Joi.object({
    userId: commonValidations.mongoId.required(),
    role: Joi.string().valid("admin", "user", "member", "moderator").required(),
  }).options({ stripUnknown: true }),

  // Add/remove moderator validation
  moderatorAction: Joi.object({
    userId: commonValidations.mongoId.required(),
  }).options({ stripUnknown: true }),

  // Update user status validation
  updateUserStatus: Joi.object({
    userId: commonValidations.mongoId.required(),
    isActive: Joi.boolean().required(),
  }).options({ stripUnknown: true }),

  // Create admin validation
  createAdmin: Joi.object({
    name: commonValidations.name.required(),
    email: commonValidations.email.required(),
    password: commonValidations.password.required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords must match",
      }),
  }).options({ stripUnknown: true }),

  // Update admin profile validation
  updateAdminProfile: Joi.object({
    name: commonValidations.name.optional(),
    email: commonValidations.email.optional(),
    phone: commonValidations.phone.optional(),
  }).options({ stripUnknown: true }),

  // Create club validation (admin-specific)
  createClub: Joi.object({
    name: commonValidations.shortText.min(2).max(100).required(),
    description: commonValidations.safeText.min(10).max(2000).required(),
    about: commonValidations.safeText.max(5000).optional(),
    domains: Joi.alternatives()
      .try(
        Joi.array().items(commonValidations.shortText),
        commonValidations.shortText
      )
      .optional(),
  }).options({ stripUnknown: true }),

  // Update club validation (admin-specific)
  updateClub: Joi.object({
    name: commonValidations.shortText.min(2).max(100).optional(),
    description: commonValidations.safeText.min(10).max(2000).optional(),
    about: commonValidations.safeText.max(5000).optional(),
    domains: Joi.alternatives()
      .try(
        Joi.array().items(commonValidations.shortText),
        commonValidations.shortText
      )
      .optional(),
  }).options({ stripUnknown: true }),

  // Edit event validation (admin-specific)
  editEvent: Joi.object({
    name: commonValidations.shortText.min(3).max(200).optional(),
    description: commonValidations.safeText.min(10).max(5000).optional(),
    date: commonValidations.date.optional(),
    time: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    venue: commonValidations.shortText.max(200).optional(),
    maxParticipants: Joi.number().integer().min(1).max(10000).optional(),
    registrationDeadline: commonValidations.date.optional(),
    status: Joi.string()
      .valid("upcoming", "ongoing", "completed", "cancelled")
      .optional(),
  }).options({ stripUnknown: true }),

  // Add/remove moderator validation
  addModerator: Joi.object({
    userId: commonValidations.mongoId.required(),
  }).options({ stripUnknown: true }),

  removeModerator: Joi.object({
    userId: commonValidations.mongoId.required(),
  }).options({ stripUnknown: true }),
};

/**
 * Parameter validation schemas (for URL parameters)
 */
export const paramValidationSchemas = {
  // MongoDB ID parameter
  id: Joi.object({
    id: commonValidations.mongoId.required(),
  }),

  // Username parameter
  username: Joi.object({
    username: commonValidations.username.required(),
  }), // JWT Token parameter (for email verification - 200-500+ characters)
  jwtToken: Joi.object({
    token: Joi.string()
      .required()
      .max(1000)
      .pattern(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/)
      .messages({
        "string.max": "Token is too long",
        "string.pattern.base": "Invalid JWT token format",
      }),
  }),

  // Crypto Token parameter (for password reset - 64 hex characters)
  cryptoToken: Joi.object({
    token: Joi.string()
      .required()
      .length(64)
      .pattern(/^[a-f0-9]{64}$/)
      .messages({
        "string.length": "Invalid token length",
        "string.pattern.base": "Invalid token format",
      }),
  }),

  // Generic token parameter (accepts both formats)
  token: Joi.object({
    token: Joi.string()
      .required()
      .max(1000)
      .custom((value, helpers) => {
        // Check if it's a JWT token (3 parts separated by dots)
        const jwtParts = value.split(".");
        if (jwtParts.length === 3) {
          // Validate as JWT
          if (
            !/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(value)
          ) {
            return helpers.error("any.invalid");
          }
          return value;
        }

        // Check if it's a crypto token (64 hex characters)
        if (value.length === 64 && /^[a-f0-9]{64}$/.test(value)) {
          return value;
        }

        return helpers.error("any.invalid");
      })
      .messages({
        "any.invalid": "Invalid token format",
      }),
  }),
};

/**
 * Query parameter validation schemas
 */
export const queryValidationSchemas = {
  // General search query
  search: Joi.object({
    q: commonValidations.safeText.max(100).optional(),
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid("date", "name", "relevance").default("date"),
    order: Joi.string().valid("asc", "desc").default("desc"),
  }).options({ stripUnknown: true }),

  // Filter queries
  filter: Joi.object({
    category: commonValidations.shortText.optional(),
    date: commonValidations.date.optional(),
    club: commonValidations.mongoId.optional(),
    status: Joi.string().valid("active", "inactive", "past").optional(),
  }).options({ stripUnknown: true }),
};

/**
 * Announcement validation schemas
 */
export const announcementValidationSchemas = {
  // Create announcement validation
  createAnnouncement: Joi.object({
    title: commonValidations.shortText.min(3).max(200).required(),
    content: commonValidations.safeText.min(10).max(5000).required(),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .default("medium"),
    expiresAt: commonValidations.date.min("now").optional(),
    targetAudience: Joi.string()
      .valid("all", "students", "moderators", "admins")
      .default("all"),
    isActive: Joi.boolean().default(true),
  }).options({ stripUnknown: true }),

  // Update announcement validation
  updateAnnouncement: Joi.object({
    title: commonValidations.shortText.min(3).max(200).optional(),
    content: commonValidations.safeText.min(10).max(5000).optional(),
    priority: Joi.string().valid("low", "medium", "high", "urgent").optional(),
    expiresAt: commonValidations.date.min("now").optional(),
    targetAudience: Joi.string()
      .valid("all", "students", "moderators", "admins")
      .optional(),
    isActive: Joi.boolean().optional(),
  }).options({ stripUnknown: true }),
};

/**
 * Utility function to sanitize custom fields for recruitment applications
 */
export const sanitizeCustomFields = (customFields) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(customFields)) {
    // Validate key format
    if (
      typeof key === "string" &&
      key.length <= 100 &&
      /^[a-zA-Z0-9_-]+$/.test(key)
    ) {
      // Sanitize value
      if (typeof value === "string") {
        // Remove HTML tags and limit length
        const cleanValue = value.replace(/<[^>]*>/g, "").trim();
        if (cleanValue.length <= 5000) {
          sanitized[key] = cleanValue;
        }
      }
    }
  }

  return sanitized;
};

/**
 * MongoDB query sanitization to prevent NoSQL injection
 */
export const sanitizeMongoQuery = (query) => {
  if (typeof query !== "object" || query === null) {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    // Prevent MongoDB operators in keys
    if (typeof key === "string" && !key.startsWith("$") && key.length <= 100) {
      // Sanitize values
      if (typeof value === "string") {
        sanitized[key] = value.slice(0, 1000); // Limit string length
      } else if (typeof value === "number" && Number.isFinite(value)) {
        sanitized[key] = value;
      } else if (typeof value === "boolean") {
        sanitized[key] = value;
      } else if (mongoose.Types.ObjectId.isValid(value)) {
        sanitized[key] = value;
      }
      // Skip objects, arrays, and other complex types to prevent injection
    }
  }

  return sanitized;
};

export default {
  authValidationSchemas,
  userValidationSchemas,
  eventValidationSchemas,
  clubValidationSchemas,
  recruitmentValidationSchemas,
  adminValidationSchemas,
  paramValidationSchemas,
  queryValidationSchemas,
  sanitizeCustomFields,
  sanitizeMongoQuery,
  commonValidations,
  announcementValidationSchemas,
};
