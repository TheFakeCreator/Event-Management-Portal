import { env } from '@/lib/env';

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
  folder?: string;
  version: number;
  signature: string;
  etag: string;
}

export interface CloudinaryError {
  message: string;
  name: string;
  http_code: number;
}

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  tags?: string[];
  context?: Record<string, string>;
  eager?: string[];
  format?: string;
  quality?: string | number;
  crop?: string;
  width?: number;
  height?: number;
  gravity?: string;
}

class CloudinaryUploader {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey?: string;
  private baseUrl: string;

  constructor() {
    // On server we can rely on env helpers (they validate on server start).
    // In the browser the env helpers expect validateEnvironment() to have run
    // (which doesn't happen client-side), so fall back to NEXT_PUBLIC_* vars.
    let config: { cloudName?: string; uploadPreset?: string; apiKey?: string } =
      {};

    if (typeof window === 'undefined') {
      // Server-side: use validated env getters
      try {
        config = env.getCloudinaryConfig();
      } catch (e) {
        // If validation hasn't run for some reason, still try process.env
        config = {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        };
      }
    } else {
      // Client-side: read NEXT_PUBLIC_* directly (these are inlined at build)
      config = {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      };
    }

    this.cloudName = config.cloudName || '';
    this.uploadPreset = config.uploadPreset || '';
    this.apiKey = config.apiKey;
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}`;
  }

  /**
   * Safe getter for upload configuration that works both server- and client-side.
   * Falls back to NEXT_PUBLIC_* environment variables when the validated env
   * object is not available (e.g. client bundle or when validation hasn't run).
   */
  private getUploadConfigSafe() {
    try {
      // Prefer the env helper when available (server-side validated)
      if (typeof window === 'undefined') {
        return env.getUploadConfig();
      }
    } catch (e) {
      // fall through to fallback
    }

    // Client-side or fallback path: read NEXT_PUBLIC_* variables directly
    const maxFileSize =
      Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 10 * 1024 * 1024;
    const allowedFileTypes = (
      process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES ||
      'image/jpeg,image/png,image/webp,image/gif'
    )
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const maxFilesPerUpload =
      Number(process.env.NEXT_PUBLIC_MAX_FILES_PER_UPLOAD) || 5;

    return {
      maxFileSize,
      allowedFileTypes,
      maxFilesPerUpload,
    };
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);

      // Add optional parameters
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.tags) {
        formData.append('tags', options.tags.join(','));
      }

      if (options.context) {
        const contextString = Object.entries(options.context)
          .map(([key, value]) => `${key}=${value}`)
          .join('|');
        formData.append('context', contextString);
      }

      if (options.transformation) {
        formData.append('transformation', options.transformation);
      }

      if (options.eager) {
        formData.append('eager', options.eager.join(','));
      }

      if (options.format) {
        formData.append('format', options.format);
      }

      if (options.quality) {
        formData.append('quality', options.quality.toString());
      }

      // Create transformation string for resize options
      const transformations: string[] = [];
      if (options.crop) transformations.push(`c_${options.crop}`);
      if (options.width) transformations.push(`w_${options.width}`);
      if (options.height) transformations.push(`h_${options.height}`);
      if (options.gravity) transformations.push(`g_${options.gravity}`);

      if (transformations.length > 0) {
        formData.append('transformation', transformations.join(','));
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          // Emit progress event that can be listened to
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('cloudinary-upload-progress', {
                detail: {
                  percentComplete: Math.round(percentComplete),
                  loaded: event.loaded,
                  total: event.total,
                  file: file.name,
                },
              })
            );
          }
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(
              xhr.responseText
            ) as CloudinaryUploadResponse;
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText) as CloudinaryError;
            reject(
              new Error(error.message || `HTTP ${xhr.status}: Upload failed`)
            );
          } catch {
            reject(new Error(`HTTP ${xhr.status}: Upload failed`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.timeout = 30000; // 30 second timeout
      xhr.open('POST', `${this.baseUrl}/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files in parallel
   */
  async uploadFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Generate a Cloudinary URL for transformations
   */
  generateUrl(
    publicId: string,
    transformations?: string,
    format?: string
  ): string {
    let url = `https://res.cloudinary.com/${this.cloudName}/image/upload`;

    if (transformations) {
      url += `/${transformations}`;
    }

    url += `/${publicId}`;

    if (format) {
      url += `.${format}`;
    }

    return url;
  }

  /**
   * Generate optimized image URL
   */
  generateOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: 'auto' | number;
      format?: 'auto' | string;
      crop?: 'scale' | 'fit' | 'fill' | 'crop';
      gravity?: string;
    } = {}
  ): string {
    const transformations: string[] = [];

    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.gravity) transformations.push(`g_${options.gravity}`);

    return this.generateUrl(publicId, transformations.join(','));
  }

  /**
   * Delete an uploaded image
   */
  async deleteFile(publicId: string): Promise<{ result: string }> {
    if (!this.apiKey) {
      throw new Error('Cloudinary API key required for delete operations');
    }

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', this.apiKey);
    // Note: API secret should be handled server-side for security
    // This is a client-side implementation that requires special setup

    const response = await fetch(`${this.baseUrl}/destroy`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const uploadConfig = this.getUploadConfigSafe();

    // Check file size
    if (file.size > uploadConfig.maxFileSize) {
      return {
        valid: false,
        error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(uploadConfig.maxFileSize / 1024 / 1024)}MB)`,
      };
    }

    // Check file type
    if (!uploadConfig.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${uploadConfig.allowedFileTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const uploadConfig = this.getUploadConfigSafe();
    const errors: string[] = [];

    // Check number of files
    if (files.length > uploadConfig.maxFilesPerUpload) {
      errors.push(
        `Too many files. Maximum allowed: ${uploadConfig.maxFilesPerUpload}`
      );
    }

    // Validate each file
    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Create singleton instance
export const cloudinary = new CloudinaryUploader();

// Export helper functions
export const uploadToCloudinary = cloudinary.uploadFile.bind(cloudinary);
export const uploadMultipleToCloudinary =
  cloudinary.uploadFiles.bind(cloudinary);
export const generateCloudinaryUrl = cloudinary.generateUrl.bind(cloudinary);
export const generateOptimizedImageUrl =
  cloudinary.generateOptimizedUrl.bind(cloudinary);
export const validateCloudinaryFile = cloudinary.validateFile.bind(cloudinary);
export const validateCloudinaryFiles =
  cloudinary.validateFiles.bind(cloudinary);
