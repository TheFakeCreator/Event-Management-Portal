import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Simplified upload middleware for now
// TODO: Implement proper Cloudinary integration when needed

// File upload interfaces
interface UploadOptions {
  maxSize?: number;
  allowedFormats?: string[];
  maxFiles?: number;
}

// Default upload configuration
const DEFAULT_CONFIG: UploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  maxFiles: 5,
};

/**
 * Basic memory storage for development
 * In production, this should use Cloudinary storage
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 */
const createFileFilter = (
  allowedFormats: string[] = DEFAULT_CONFIG.allowedFormats!
) => {
  return (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const fileExtension = file.mimetype.split('/')[1];

    if (allowedFormats.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type not allowed. Allowed formats: ${allowedFormats.join(', ')}`
        )
      );
    }
  };
};

/**
 * Create upload middleware with custom options
 */
export const createUploadMiddleware = (options: UploadOptions = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };

  return multer({
    storage,
    limits: {
      fileSize: config.maxSize,
      files: config.maxFiles,
    },
    fileFilter: createFileFilter(config.allowedFormats),
  });
};

/**
 * File upload error handler middleware
 */
export const uploadErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File too large',
        error: `Maximum file size is ${DEFAULT_CONFIG.maxSize! / (1024 * 1024)}MB`,
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: 'Too many files',
        error: `Maximum ${DEFAULT_CONFIG.maxFiles} files allowed`,
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        message: 'Unexpected file field',
        error: err.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message,
      });
    }
  } else if (err.message.includes('File type not allowed')) {
    res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: err.message,
    });
  } else {
    next(err);
  }
};

// Default upload instances
export const upload = createUploadMiddleware();

// Specific upload configurations
export const eventImageUpload = createUploadMiddleware({
  maxSize: 10 * 1024 * 1024, // 10MB for event images
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  maxFiles: 1,
});

export const clubImageUpload = createUploadMiddleware({
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  maxFiles: 1,
});

export const profileImageUpload = createUploadMiddleware({
  maxSize: 2 * 1024 * 1024, // 2MB for profile images
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  maxFiles: 1,
});

export default upload;
