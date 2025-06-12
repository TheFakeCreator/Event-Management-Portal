/**
 * Centralized File Upload Security Configuration
 * Defines all security settings and policies for file uploads
 */

export const FILE_UPLOAD_CONFIG = {
  // File size limits (in bytes)
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB for images
    DOCUMENT: 10 * 1024 * 1024, // 10MB for documents
    PROFILE_AVATAR: 2 * 1024 * 1024, // 2MB for profile avatars
    CLUB_GALLERY: 8 * 1024 * 1024, // 8MB for club gallery images
  },

  // Allowed MIME types
  MIME_TYPES: {
    IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    DOCUMENT: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    AUDIO: ["audio/mpeg", "audio/wav", "audio/mp3"],
    VIDEO: ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"],
  },

  // File extensions
  ALLOWED_EXTENSIONS: {
    IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    DOCUMENT: [".pdf", ".doc", ".docx", ".txt"],
    AUDIO: [".mp3", ".wav", ".mpeg"],
    VIDEO: [".mp4", ".mpeg", ".mov", ".webm"],
  },

  // Rate limiting
  RATE_LIMITS: {
    UPLOADS_PER_HOUR: 20, // Maximum uploads per hour per IP
    UPLOADS_PER_DAY: 100, // Maximum uploads per day per user
    WINDOW_HOURS: 1, // Time window for rate limiting
  },

  // Cloudinary settings
  CLOUDINARY: {
    FOLDER_STRUCTURE: {
      PROFILE_AVATARS: "users/avatars",
      CLUB_IMAGES: "clubs/main",
      CLUB_GALLERY: "clubs/gallery",
      EVENT_IMAGES: "events",
      ANNOUNCEMENTS: "announcements",
      DOCUMENTS: "documents",
    },

    TRANSFORMATIONS: {
      PROFILE_AVATAR: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
      CLUB_IMAGE: [
        { width: 1200, height: 800, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
      GALLERY_IMAGE: [
        { width: 1600, height: 1200, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
      THUMBNAIL: [
        { width: 300, height: 200, crop: "fill" },
        { quality: "auto" },
      ],
    },
  },

  // Security policies
  SECURITY: {
    VIRUS_SCAN_ENABLED: true,
    FILE_SIGNATURE_CHECK: true,
    FILENAME_SANITIZATION: true,
    MAX_FILENAME_LENGTH: 100,
    QUARANTINE_SUSPICIOUS_FILES: true,

    // Prohibited filename patterns
    PROHIBITED_PATTERNS: [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar)$/i,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
      /[<>:"/\\|?*]/,
      /\.\./,
      /^\.+$/,
    ],

    // Content validation
    VALIDATE_IMAGE_HEADERS: true,
    CHECK_EXIF_DATA: true,
    STRIP_METADATA: true,

    // Upload limits per endpoint
    ENDPOINT_LIMITS: {
      "/upload/profile": {
        maxFiles: 1,
        fileTypes: ["IMAGE"],
        maxSize: "PROFILE_AVATAR",
      },
      "/club/*/gallery/upload": {
        maxFiles: 1,
        fileTypes: ["IMAGE"],
        maxSize: "CLUB_GALLERY",
      },
      "/club/*/image/upload": {
        maxFiles: 1,
        fileTypes: ["IMAGE"],
        maxSize: "CLUB_IMAGE",
      },
      "/user/*/edit": {
        maxFiles: 1,
        fileTypes: ["IMAGE"],
        maxSize: "PROFILE_AVATAR",
      },
    },
  },

  // Error messages
  ERROR_MESSAGES: {
    FILE_TOO_LARGE: "File size exceeds the maximum allowed limit.",
    INVALID_FILE_TYPE:
      "Invalid file type. Please upload a supported file format.",
    INVALID_FILE_EXTENSION:
      "Invalid file extension. Please check the allowed file types.",
    VIRUS_DETECTED: "File upload rejected by security scanner.",
    RATE_LIMIT_EXCEEDED: "Too many file uploads. Please try again later.",
    INVALID_FILENAME:
      "Invalid filename. Please use only alphanumeric characters.",
    UPLOAD_FAILED: "File upload failed. Please try again.",
    NO_FILE_PROVIDED: "No file was provided for upload.",
  },
};

/**
 * Get file upload configuration for specific endpoint
 */
export function getUploadConfigForEndpoint(endpoint, fileType = "IMAGE") {
  const endpointConfig = FILE_UPLOAD_CONFIG.SECURITY.ENDPOINT_LIMITS[endpoint];

  if (!endpointConfig) {
    // Default configuration
    return {
      maxFiles: 1,
      fileTypes: [fileType],
      maxSize:
        FILE_UPLOAD_CONFIG.MAX_FILE_SIZE[fileType] ||
        FILE_UPLOAD_CONFIG.MAX_FILE_SIZE.IMAGE,
      allowedMimeTypes:
        FILE_UPLOAD_CONFIG.MIME_TYPES[fileType] ||
        FILE_UPLOAD_CONFIG.MIME_TYPES.IMAGE,
      allowedExtensions:
        FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS[fileType] ||
        FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.IMAGE,
    };
  }

  return {
    ...endpointConfig,
    maxSize:
      FILE_UPLOAD_CONFIG.MAX_FILE_SIZE[endpointConfig.maxSize] ||
      endpointConfig.maxSize,
    allowedMimeTypes: endpointConfig.fileTypes.flatMap(
      (type) => FILE_UPLOAD_CONFIG.MIME_TYPES[type] || []
    ),
    allowedExtensions: endpointConfig.fileTypes.flatMap(
      (type) => FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS[type] || []
    ),
  };
}

/**
 * Validate if file meets security requirements
 */
export function validateFileSecurityRequirements(file, endpoint) {
  const config = getUploadConfigForEndpoint(endpoint);
  const errors = [];

  // Check file size
  if (file.size > config.maxSize) {
    errors.push({
      code: "FILE_TOO_LARGE",
      message: FILE_UPLOAD_CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE,
      details: { size: file.size, maxSize: config.maxSize },
    });
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.mimetype)) {
    errors.push({
      code: "INVALID_FILE_TYPE",
      message: FILE_UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FILE_TYPE,
      details: { mimetype: file.mimetype, allowed: config.allowedMimeTypes },
    });
  }

  // Check file extension
  const extension = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf("."));
  if (!config.allowedExtensions.includes(extension)) {
    errors.push({
      code: "INVALID_FILE_EXTENSION",
      message: FILE_UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FILE_EXTENSION,
      details: { extension, allowed: config.allowedExtensions },
    });
  }

  // Check filename security
  const prohibitedPatterns = FILE_UPLOAD_CONFIG.SECURITY.PROHIBITED_PATTERNS;
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(file.originalname)) {
      errors.push({
        code: "INVALID_FILENAME",
        message: FILE_UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FILENAME,
        details: { filename: file.originalname, pattern: pattern.toString() },
      });
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default FILE_UPLOAD_CONFIG;
