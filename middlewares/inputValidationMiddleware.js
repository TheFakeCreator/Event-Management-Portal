/**
 * Input Validation Middleware
 * Provides reusable validation middleware for different types of inputs
 * Prevents NoSQL injection and ensures data integrity
 */

import {
  authValidationSchemas,
  userValidationSchemas,
  eventValidationSchemas,
  clubValidationSchemas,
  recruitmentValidationSchemas,
  adminValidationSchemas,
  announcementValidationSchemas,
  paramValidationSchemas,
  queryValidationSchemas,
  sanitizeCustomFields,
  sanitizeMongoQuery,
} from "../utils/inputValidation.js";
import { logSecurityEvent, SECURITY_EVENTS } from "../utils/securityLogger.js";

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - 'body', 'params', 'query'
 * @param {Object} options - Additional options
 */
const createValidationMiddleware = (schema, source = "body", options = {}) => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];

      // Validate the data against the schema
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Collect all errors
        allowUnknown: false, // Reject unknown fields
        stripUnknown: true, // Remove unknown fields
        ...options,
      });

      if (error) {
        // Log validation failure for security monitoring
        logSecurityEvent(
          SECURITY_EVENTS.VALIDATION_FAILED,
          {
            source,
            errors: error.details.map((detail) => ({
              field: detail.path.join("."),
              message: detail.message,
              value: detail.context?.value,
            })),
            ip: req.ip,
            userAgent: req.get("User-Agent"),
          },
          req
        );

        // Return validation errors
        const errorMessages = error.details.map((detail) => detail.message);

        if (req.accepts("json")) {
          return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: errorMessages,
          });
        } else {
          req.flash("error", errorMessages.join(". "));
          return res.redirect("back");
        }
      }

      // Replace the original data with validated and sanitized data
      req[source] = value;
      next();
    } catch (validationError) {
      // Log unexpected validation errors
      logSecurityEvent(
        SECURITY_EVENTS.VALIDATION_ERROR,
        {
          error: validationError.message,
          source,
          data: req[source],
        },
        req
      );

      next(validationError);
    }
  };
};

/**
 * Authentication validation middlewares
 */
export const validateAuth = {
  register: createValidationMiddleware(authValidationSchemas.register),
  login: createValidationMiddleware(authValidationSchemas.login),
  resetPassword: createValidationMiddleware(
    authValidationSchemas.resetPassword
  ),
  forgotPassword: createValidationMiddleware(
    authValidationSchemas.forgotPassword
  ),
};

/**
 * User validation middlewares
 */
export const validateUser = {
  updateProfile: createValidationMiddleware(
    userValidationSchemas.updateProfile
  ),
  requestRole: createValidationMiddleware(userValidationSchemas.requestRole),
};

/**
 * Event validation middlewares
 */
export const validateEvent = {
  create: createValidationMiddleware(eventValidationSchemas.createEvent),
  update: createValidationMiddleware(eventValidationSchemas.updateEvent),
  register: createValidationMiddleware(eventValidationSchemas.registerEvent),
  report: createValidationMiddleware(eventValidationSchemas.reportEvent),
};

/**
 * Club validation middlewares
 */
export const validateClub = {
  create: createValidationMiddleware(clubValidationSchemas.createClub),
  update: createValidationMiddleware(clubValidationSchemas.updateClub),
  updateAbout: createValidationMiddleware(clubValidationSchemas.updateClub),
  addSponsor: createValidationMiddleware(clubValidationSchemas.createClub), // Reuse create schema for sponsors
  editSponsor: createValidationMiddleware(clubValidationSchemas.updateClub), // Reuse update schema for sponsors
};

/**
 * Recruitment validation middlewares
 */
export const validateRecruitment = {
  create: createValidationMiddleware(
    recruitmentValidationSchemas.createRecruitment
  ),
  apply: (req, res, next) => {
    // First validate basic fields
    const basicValidation = createValidationMiddleware(
      recruitmentValidationSchemas.applyRecruitment
    );

    basicValidation(req, res, (err) => {
      if (err) return next(err);

      // Then sanitize custom fields
      const customFields = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (key.startsWith("custom_")) {
          customFields[key] = value;
        }
      }

      req.body.customFields = sanitizeCustomFields(customFields);
      next();
    });
  },
};

/**
 * Admin validation middlewares
 */
export const validateAdmin = {
  assignRole: createValidationMiddleware(adminValidationSchemas.assignRole),
  moderatorAction: createValidationMiddleware(
    adminValidationSchemas.moderatorAction
  ),
  createClub: createValidationMiddleware(adminValidationSchemas.createClub),
  updateClub: createValidationMiddleware(adminValidationSchemas.updateClub),
  editEvent: createValidationMiddleware(adminValidationSchemas.editEvent),
  addModerator: createValidationMiddleware(adminValidationSchemas.addModerator),
  removeModerator: createValidationMiddleware(
    adminValidationSchemas.removeModerator
  ),
};

/**
 * Parameter validation middlewares
 */
export const validateParams = (allowedParams = ["id"]) => {
  return (req, res, next) => {
    try {
      const params = req.params;
      const validatedParams = {};

      for (const param of allowedParams) {
        if (params[param]) {
          if (param === "id" || param.endsWith("Id")) {
            // Validate MongoDB ObjectId
            const { error, value } = paramValidationSchemas.id.validate({
              id: params[param],
            });
            if (error) {
              logSecurityEvent(SECURITY_EVENTS.VALIDATION_FAILED, {
                source: "params",
                parameter: param,
                value: params[param],
                error: error.message,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
              });
              return res.status(400).json({
                message: `Invalid ${param} parameter`,
                errors: [
                  { field: param, message: `Invalid MongoDB ObjectId format` },
                ],
              });
            }
            validatedParams[param] = value.id;
          } else if (param === "token") {
            // JWT tokens can be much longer (200-400+ characters)
            // Validate token format but don't truncate
            const { error, value } = paramValidationSchemas.token.validate({
              token: params[param],
            });
            if (error) {
              logSecurityEvent(SECURITY_EVENTS.VALIDATION_FAILED, {
                source: "params",
                parameter: param,
                value: params[param].substring(0, 50), // Log only first 50 chars for security
                error: error.message,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
              });
              return res.status(400).json({
                message: `Invalid ${param} parameter`,
                errors: [{ field: param, message: `Invalid token format` }],
              });
            }
            validatedParams[param] = value.token;
          } else {
            // For other parameters, apply basic sanitization
            validatedParams[param] =
              typeof params[param] === "string"
                ? params[param].slice(0, 100).trim()
                : params[param];
          }
        }
      }

      req.params = validatedParams;
      next();
    } catch (error) {
      logSecurityEvent(SECURITY_EVENTS.VALIDATION_FAILED, {
        source: "params",
        error: error.message,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(400).json({ message: "Parameter validation failed" });
    }
  };
};

/**
 * Query validation middlewares
 */
export const validateQuery = (allowedParams = ["page", "limit"]) => {
  return (req, res, next) => {
    try {
      const query = req.query;
      const validatedQuery = {};

      for (const param of allowedParams) {
        if (query[param] !== undefined) {
          const value = query[param];

          switch (param) {
            case "page":
              const page = parseInt(value);
              if (isNaN(page) || page < 1 || page > 1000) {
                validatedQuery.page = 1;
              } else {
                validatedQuery.page = page;
              }
              break;

            case "limit":
              const limit = parseInt(value);
              if (isNaN(limit) || limit < 1 || limit > 100) {
                validatedQuery.limit = 10;
              } else {
                validatedQuery.limit = limit;
              }
              break;

            case "search":
            case "q":
              if (typeof value === "string") {
                validatedQuery[param] = value
                  .slice(0, 100)
                  .trim()
                  .replace(/<[^>]*>/g, "");
              }
              break;

            default:
              // For other parameters, apply basic sanitization
              if (typeof value === "string") {
                validatedQuery[param] = value.slice(0, 255).trim();
              } else if (typeof value === "number" && Number.isFinite(value)) {
                validatedQuery[param] = value;
              }
              break;
          }
        }
      }

      req.query = validatedQuery;
      next();
    } catch (error) {
      logSecurityEvent(SECURITY_EVENTS.VALIDATION_FAILED, {
        source: "query",
        error: error.message,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      res.status(400).json({ message: "Query validation failed" });
    }
  };
};

/**
 * MongoDB query sanitization middleware
 * Prevents NoSQL injection in database queries
 */
export const sanitizeDbQuery = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeMongoQuery(req.query);
    }

    // Sanitize body for search/filter operations
    if (req.body && req.body.filter && typeof req.body.filter === "object") {
      req.body.filter = sanitizeMongoQuery(req.body.filter);
    }

    next();
  } catch (error) {
    logSecurityEvent(
      SECURITY_EVENTS.SANITIZATION_ERROR,
      {
        error: error.message,
        query: req.query,
        body: req.body,
      },
      req
    );

    next(error);
  }
};

/**
 * File upload validation middleware factory
 */
export const validateFileUpload = (options = {}) => {
  const {
    fileTypes = ["image"],
    maxSize = 5 * 1024 * 1024, // 5MB default
    required = false,
  } = options;

  // Define allowed mime types based on file types
  const mimeTypeMap = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    audio: ["audio/mpeg", "audio/wav", "audio/mp3"],
    video: ["video/mp4", "video/mpeg", "video/quicktime"],
  };

  let allowedTypes = [];
  fileTypes.forEach((type) => {
    if (mimeTypeMap[type]) {
      allowedTypes = allowedTypes.concat(mimeTypeMap[type]);
    }
  });

  return (req, res, next) => {
    // Check if file is required but not provided
    if (required && !req.file) {
      logSecurityEvent(
        SECURITY_EVENTS.VALIDATION_FAILED,
        {
          field: "file",
          message: "File is required but not provided",
        },
        req
      );

      req.flash("error", "File upload is required.");
      return res.redirect("back");
    }

    // If file is provided, validate it
    if (req.file) {
      // Check file type
      if (
        allowedTypes.length > 0 &&
        !allowedTypes.includes(req.file.mimetype)
      ) {
        logSecurityEvent(
          SECURITY_EVENTS.INVALID_FILE_UPLOAD,
          {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            allowedTypes,
          },
          req
        );

        req.flash(
          "error",
          `Invalid file type. Only ${fileTypes.join(", ")} files are allowed.`
        );
        return res.redirect("back");
      }

      // Check file size
      if (req.file.size > maxSize) {
        logSecurityEvent(
          SECURITY_EVENTS.FILE_TOO_LARGE,
          {
            filename: req.file.originalname,
            size: req.file.size,
            maxSize,
          },
          req
        );

        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        req.flash(
          "error",
          `File size too large. Maximum allowed size is ${maxSizeMB}MB.`
        );
        return res.redirect("back");
      }

      // Log successful file upload validation
      logSecurityEvent(
        SECURITY_EVENTS.FILE_UPLOAD_VALIDATED,
        {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        req
      );
    }

    next();
  };
};

/**
 * Rate limiting validation middleware
 * Additional layer for sensitive operations
 */
export const validateSensitiveOperation = (req, res, next) => {
  const sensitiveOperations = [
    "password_reset",
    "email_verification",
    "role_request",
    "file_upload",
  ];

  const operation = req.body.operation || req.query.operation;

  if (sensitiveOperations.includes(operation)) {
    // Log sensitive operation attempt
    logSecurityEvent(
      SECURITY_EVENTS.SENSITIVE_OPERATION,
      {
        operation,
        userId: req.user?.id,
        ip: req.ip,
      },
      req
    );
  }

  next();
};

/**
 * XSS prevention middleware
 * Additional sanitization for rich text content
 */
export const preventXSS = (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  ];

  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          logSecurityEvent(
            SECURITY_EVENTS.XSS_ATTEMPT,
            {
              pattern: pattern.toString(),
              value: value.substring(0, 100),
              ip: req.ip,
            },
            req
          );

          return value.replace(pattern, "");
        }
      }
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (typeof obj === "object" && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === "object") {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };

  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }

  next();
};

/**
 * Combined security middleware
 * Applies multiple security checks in the correct order
 */
export const securityMiddleware = [
  sanitizeDbQuery,
  preventXSS,
  validateSensitiveOperation,
];

/**
 * Announcement validation middlewares
 */
export const validateAnnouncement = {
  create: createValidationMiddleware(
    announcementValidationSchemas.createAnnouncement
  ),
  update: createValidationMiddleware(
    announcementValidationSchemas.updateAnnouncement
  ),
};

export default {
  validateAuth,
  validateUser,
  validateEvent,
  validateClub,
  validateRecruitment,
  validateAdmin,
  validateAnnouncement,
  validateParams,
  validateQuery,
  sanitizeDbQuery,
  validateFileUpload,
  preventXSS,
  securityMiddleware,
};
