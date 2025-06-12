/**
 * Enhanced XSS Protection Middleware
 * Applies specific XSS protection based on route context
 */

import { sanitizeInput, sanitizeObject } from "../utils/xssProtection.js";
import { logSecurityEvent, SECURITY_EVENTS } from "../utils/securityLogger.js";

/**
 * Apply XSS protection to user registration and profile updates
 */
const protectUserInput = (req, res, next) => {
  if (req.body) {
    // Strict sanitization for user personal data
    if (req.body.name) {
      req.body.name = sanitizeInput.user(req.body.name);
    }

    if (req.body.username) {
      req.body.username = sanitizeInput.user(req.body.username);
    }

    if (req.body.email) {
      req.body.email = sanitizeInput.email(req.body.email);
    }

    if (req.body.bio) {
      req.body.bio = sanitizeInput.text(req.body.bio);
    }

    if (req.body.occupation) {
      req.body.occupation = sanitizeInput.user(req.body.occupation);
    }

    if (req.body.location) {
      req.body.location = sanitizeInput.user(req.body.location);
    }

    // Social links need URL validation
    if (req.body.linkedin) {
      req.body.linkedin = sanitizeInput.url(req.body.linkedin);
    }

    if (req.body.github) {
      req.body.github = sanitizeInput.url(req.body.github);
    }

    if (req.body.behance) {
      req.body.behance = sanitizeInput.url(req.body.behance);
    }
  }

  next();
};

/**
 * Apply XSS protection to event creation and updates
 */
const protectEventInput = (req, res, next) => {
  if (req.body) {
    // Event title should be user-safe
    if (req.body.title) {
      req.body.title = sanitizeInput.user(req.body.title);
    }

    // Event description can have rich content but must be safe
    if (req.body.description) {
      req.body.description = sanitizeInput.rich(req.body.description);
    }

    // Location should be user-safe
    if (req.body.location || req.body.venue) {
      req.body.location = sanitizeInput.user(
        req.body.location || req.body.venue
      );
      req.body.venue = req.body.location;
    }

    // Image URLs need validation
    if (req.body.image) {
      req.body.image = sanitizeInput.url(req.body.image);
    }

    // Registration details
    if (req.body.registrationDetails) {
      req.body.registrationDetails = sanitizeInput.rich(
        req.body.registrationDetails
      );
    }

    // Sponsor information
    if (req.body.sponsors && Array.isArray(req.body.sponsors)) {
      req.body.sponsors = req.body.sponsors.map((sponsor) => ({
        name: sanitizeInput.user(sponsor.name),
        logo: sanitizeInput.url(sponsor.logo),
        website: sanitizeInput.url(sponsor.website),
        description: sanitizeInput.text(sponsor.description),
      }));
    }
  }

  next();
};

/**
 * Apply XSS protection to club content
 */
const protectClubInput = (req, res, next) => {
  if (req.body) {
    if (req.body.name) {
      req.body.name = sanitizeInput.user(req.body.name);
    }

    if (req.body.description) {
      req.body.description = sanitizeInput.rich(req.body.description);
    }

    if (req.body.about) {
      req.body.about = sanitizeInput.rich(req.body.about);
    }

    if (req.body.image) {
      req.body.image = sanitizeInput.url(req.body.image);
    }

    if (req.body.banner) {
      req.body.banner = sanitizeInput.url(req.body.banner);
    }

    // Social media links
    if (req.body.social) {
      const social = req.body.social;
      if (social.email) social.email = sanitizeInput.email(social.email);
      if (social.instagram)
        social.instagram = sanitizeInput.url(social.instagram);
      if (social.facebook) social.facebook = sanitizeInput.url(social.facebook);
      if (social.twitter) social.twitter = sanitizeInput.url(social.twitter);
      if (social.linkedin) social.linkedin = sanitizeInput.url(social.linkedin);
      if (social.website) social.website = sanitizeInput.url(social.website);
    }
  }

  next();
};

/**
 * Apply XSS protection to recruitment content
 */
const protectRecruitmentInput = (req, res, next) => {
  if (req.body) {
    if (req.body.title) {
      req.body.title = sanitizeInput.user(req.body.title);
    }

    if (req.body.description) {
      req.body.description = sanitizeInput.rich(req.body.description);
    }

    if (req.body.requirements) {
      req.body.requirements = sanitizeInput.rich(req.body.requirements);
    }

    // Application responses
    if (req.body.name) {
      req.body.name = sanitizeInput.user(req.body.name);
    }

    if (req.body.email) {
      req.body.email = sanitizeInput.email(req.body.email);
    }

    // Custom field responses
    Object.keys(req.body).forEach((key) => {
      if (key.startsWith("custom_")) {
        req.body[key] = sanitizeInput.text(req.body[key]);
      }
    });
  }

  next();
};

/**
 * Apply XSS protection to announcements
 */
const protectAnnouncementInput = (req, res, next) => {
  if (req.body) {
    if (req.body.title) {
      req.body.title = sanitizeInput.user(req.body.title);
    }

    if (req.body.message) {
      req.body.message = sanitizeInput.rich(req.body.message);
    }
  }

  next();
};

/**
 * Apply XSS protection to comments and feedback
 */
const protectCommentInput = (req, res, next) => {
  if (req.body) {
    if (req.body.comment) {
      req.body.comment = sanitizeInput.text(req.body.comment);
    }

    if (req.body.feedback) {
      req.body.feedback = sanitizeInput.text(req.body.feedback);
    }

    if (req.body.message) {
      req.body.message = sanitizeInput.text(req.body.message);
    }
  }

  next();
};

/**
 * Apply XSS protection to search queries
 */
const protectSearchInput = (req, res, next) => {
  if (req.query) {
    if (req.query.q || req.query.search) {
      const searchTerm = req.query.q || req.query.search;
      req.query.q = sanitizeInput.user(searchTerm);
      req.query.search = req.query.q;
    }

    if (req.query.category) {
      req.query.category = sanitizeInput.user(req.query.category);
    }

    if (req.query.club) {
      req.query.club = sanitizeInput.user(req.query.club);
    }
  }

  next();
};

/**
 * Enhanced protection for admin operations
 */
const protectAdminInput = (req, res, next) => {
  // Log all admin operations for security monitoring
  logSecurityEvent(
    SECURITY_EVENTS.ADMIN_OPERATION,
    {
      operation: req.method + " " + req.path,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
    req
  );

  // Apply strict sanitization to all admin inputs
  if (req.body) {
    sanitizeObject(req.body, "user"); // Use strictest sanitization
  }

  if (req.query) {
    sanitizeObject(req.query, "user");
  }

  next();
};

/**
 * Protection for file upload metadata
 */
const protectUploadInput = (req, res, next) => {
  if (req.body) {
    if (req.body.title) {
      req.body.title = sanitizeInput.user(req.body.title);
    }

    if (req.body.description) {
      req.body.description = sanitizeInput.text(req.body.description);
    }

    if (req.body.alt) {
      req.body.alt = sanitizeInput.user(req.body.alt);
    }
  }

  // Sanitize file metadata if present
  if (req.file) {
    if (req.file.originalname) {
      req.file.originalname = sanitizeInput.user(req.file.originalname);
    }
  }

  next();
};

/**
 * CSRF token validation for forms
 */
const validateCSRFToken = (req, res, next) => {
  // Skip CSRF for API endpoints with proper authentication
  if (req.path.startsWith("/api/") && req.headers.authorization) {
    return next();
  }

  // Check for CSRF token in forms
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const csrfToken = req.body._csrf || req.headers["x-csrf-token"];
    const sessionToken = req.session.csrfToken;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      logSecurityEvent(
        SECURITY_EVENTS.CSRF_ATTEMPT,
        {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          path: req.path,
          method: req.method,
        },
        req
      );

      return res.status(403).json({ error: "Invalid CSRF token" });
    }
  }

  next();
};

// Named exports for individual middleware functions
export {
  protectUserInput,
  protectEventInput,
  protectClubInput,
  protectRecruitmentInput,
  protectAnnouncementInput,
  protectCommentInput,
  protectSearchInput,
  protectAdminInput,
  protectUploadInput,
  validateCSRFToken,
};
