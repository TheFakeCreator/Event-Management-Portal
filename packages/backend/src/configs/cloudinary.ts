import { v2 as cloudinary, ConfigOptions } from 'cloudinary';

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

/**
 * Validates that all required Cloudinary environment variables are present
 */
const validateCloudinaryConfig = (): CloudinaryConfig => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new Error(
      'Missing required Cloudinary environment variables. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.'
    );
  }

  return config as CloudinaryConfig;
};

// Validate and configure Cloudinary
const config = validateCloudinaryConfig();

const cloudinaryOptions: ConfigOptions = {
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
  secure: true, // Use HTTPS URLs
};

cloudinary.config(cloudinaryOptions);

/**
 * Utility functions for common Cloudinary operations
 */
export const cloudinaryUtils = {
  /**
   * Extract public_id from Cloudinary URL
   */
  extractPublicId: (url: string): string | null => {
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.split('.')[0];
    } catch (error) {
      console.error('Error extracting public_id from Cloudinary URL:', error);
      return null;
    }
  },

  /**
   * Generate transformation URL for images
   */
  generateTransformationUrl: (
    publicId: string,
    transformations: Record<string, any>
  ): string => {
    return cloudinary.url(publicId, transformations);
  },

  /**
   * Delete image from Cloudinary
   */
  deleteImage: async (publicId: string): Promise<any> => {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  },
};

export default cloudinary;
