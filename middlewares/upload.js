import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../configs/cloudinary.js";
import path from "path";
import { FILE_UPLOAD_CONFIG } from "../configs/fileUploadConfig.js";

// Dynamic storage configuration based on upload type
const createStorage = (uploadType = "default") => {
  const folderMap = {
    profile: FILE_UPLOAD_CONFIG.CLOUDINARY.FOLDER_STRUCTURE.PROFILE_AVATARS,
    "club-image": FILE_UPLOAD_CONFIG.CLOUDINARY.FOLDER_STRUCTURE.CLUB_IMAGES,
    "club-gallery": FILE_UPLOAD_CONFIG.CLOUDINARY.FOLDER_STRUCTURE.CLUB_GALLERY,
    event: FILE_UPLOAD_CONFIG.CLOUDINARY.FOLDER_STRUCTURE.EVENT_IMAGES,
    announcement: FILE_UPLOAD_CONFIG.CLOUDINARY.FOLDER_STRUCTURE.ANNOUNCEMENTS,
    document: FILE_UPLOAD_CONFIG.CLOUDINARY.FOLDER_STRUCTURE.DOCUMENTS,
    default: "event_images",
  };

  const transformationMap = {
    profile: FILE_UPLOAD_CONFIG.CLOUDINARY.TRANSFORMATIONS.PROFILE_AVATAR,
    "club-image": FILE_UPLOAD_CONFIG.CLOUDINARY.TRANSFORMATIONS.CLUB_IMAGE,
    "club-gallery": FILE_UPLOAD_CONFIG.CLOUDINARY.TRANSFORMATIONS.GALLERY_IMAGE,
    default: FILE_UPLOAD_CONFIG.CLOUDINARY.TRANSFORMATIONS.GALLERY_IMAGE,
  };

  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderMap[uploadType] || folderMap.default,
      format: async () => "jpg", // Convert images to JPG format
      public_id: (req, file) => {
        // Sanitize filename and add timestamp for uniqueness
        const sanitizedName = file.originalname
          .split(".")[0]
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 50); // Limit length
        return `${Date.now()}_${sanitizedName}`;
      },
      // Apply appropriate transformations based on upload type
      transformation:
        transformationMap[uploadType] || transformationMap.default,
    },
  });
};

// Default storage for backward compatibility
const storage = createStorage("default");

// Enhanced multer configuration with security constraints
const createUpload = (uploadType = "default") => {
  const storageInstance = createStorage(uploadType);

  return multer({
    storage: storageInstance,
    limits: {
      fileSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE.IMAGE, // Default to image size
      files: 1, // Maximum 1 file per request
      fields: 10, // Maximum 10 non-file fields
      fieldNameSize: 100, // Maximum field name size
      fieldSize: 1024 * 1024, // Maximum field value size (1MB)
    },
    fileFilter: (req, file, cb) => {
      // Use centralized validation
      const allowedMimeTypes = FILE_UPLOAD_CONFIG.MIME_TYPES.IMAGE;
      const allowedExtensions = FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.IMAGE;

      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error(
          FILE_UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FILE_TYPE
        );
        error.code = "INVALID_FILE_TYPE";
        return cb(error, false);
      }

      // Additional file extension validation
      const fileExtension = path.extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        const error = new Error(
          FILE_UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FILE_EXTENSION
        );
        error.code = "INVALID_FILE_EXTENSION";
        return cb(error, false);
      }

      // Validate filename using centralized security patterns
      const prohibitedPatterns =
        FILE_UPLOAD_CONFIG.SECURITY.PROHIBITED_PATTERNS;
      for (const pattern of prohibitedPatterns) {
        if (pattern.test(file.originalname)) {
          const error = new Error(
            FILE_UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_FILENAME
          );
          error.code = "INVALID_FILENAME";
          return cb(error, false);
        }
      }

      // File validation passed
      cb(null, true);
    },
  });
};

// Default upload instance
const upload = createUpload("default");

// Specialized upload instances for different purposes
export const profileUpload = createUpload("profile");
export const clubImageUpload = createUpload("club-image");
export const clubGalleryUpload = createUpload("club-gallery");
export const eventUpload = createUpload("event");
export const documentUpload = createUpload("document");

export { createUpload };
export default upload;
