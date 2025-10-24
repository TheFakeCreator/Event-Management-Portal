import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../configs/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Image optimization configuration
 */
export const IMAGE_CONFIG = {
    thumbnails: {
        width: 300,
        height: 200,
        quality: 80,
        format: 'webp'
    },
    medium: {
        width: 800,
        height: 600,
        quality: 85,
        format: 'webp'
    },
    large: {
        width: 1200,
        height: 900,
        quality: 90,
        format: 'webp'
    },
    avatar: {
        width: 150,
        height: 150,
        quality: 90,
        format: 'webp'
    },
    banner: {
        width: 1920,
        height: 600,
        quality: 85,
        format: 'webp'
    }
};

/**
 * Image optimization utility class
 */
export class ImageOptimizer {
    /**
     * Optimize image buffer with multiple sizes
     */
    static async optimizeImage(buffer, options = {}) {
        const {
            generateSizes = ['thumbnail', 'medium', 'large'],
            customSizes = {},
            preserveOriginal = false
        } = options;

        try {
            const results = {};

            // Generate optimized versions
            for (const sizeName of generateSizes) {
                const config = IMAGE_CONFIG[sizeName] || customSizes[sizeName];
                if (!config) continue;

                const optimizedBuffer = await sharp(buffer)
                    .resize(config.width, config.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toFormat(config.format, { quality: config.quality })
                    .toBuffer();

                results[sizeName] = {
                    buffer: optimizedBuffer,
                    width: config.width,
                    height: config.height,
                    format: config.format,
                    size: optimizedBuffer.length
                };
            }

            // Preserve original if requested
            if (preserveOriginal) {
                results.original = {
                    buffer: buffer,
                    size: buffer.length
                };
            }

            return results;
        } catch (error) {
            console.error('❌ Image optimization error:', error);
            throw new Error('Failed to optimize image');
        }
    }

    /**
     * Upload optimized images to Cloudinary
     */
    static async uploadOptimizedImages(imageData, folder = 'events') {
        try {
            const uploadPromises = Object.entries(imageData).map(async ([size, data]) => {
                const uploadOptions = {
                    folder: `${folder}/${size}`,
                    resource_type: 'image',
                    format: data.format || 'webp',
                    quality: 'auto:good',
                    fetch_format: 'auto'
                };

                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(data.buffer);
                });

                return {
                    size,
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    bytes: result.bytes
                };
            });

            const uploadResults = await Promise.all(uploadPromises);

            // Create URL map for easy access
            const urlMap = {};
            uploadResults.forEach(result => {
                urlMap[result.size] = result.url;
            });

            return {
                urls: urlMap,
                details: uploadResults
            };
        } catch (error) {
            console.error('❌ Cloudinary upload error:', error);
            throw new Error('Failed to upload optimized images');
        }
    }

    /**
     * Generate responsive image URLs from Cloudinary
     */
    static generateResponsiveUrls(publicId, sizes = ['thumbnail', 'medium', 'large']) {
        const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
        const urls = {};

        sizes.forEach(size => {
            const config = IMAGE_CONFIG[size];
            if (!config) return;

            const transformation = `w_${config.width},h_${config.height},c_fill,f_auto,q_auto:good`;
            urls[size] = `${baseUrl}/${transformation}/${publicId}`;
        });

        return urls;
    }

    /**
     * Create WebP variants for existing images
     */
    static async createWebPVariant(imageUrl) {
        try {
            // Extract public_id from Cloudinary URL
            const publicIdMatch = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
            if (!publicIdMatch) {
                throw new Error('Invalid Cloudinary URL format');
            }

            const publicId = publicIdMatch[1];
            const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

            return {
                webp: `${baseUrl}/f_webp,q_auto:good/${publicId}`,
                avif: `${baseUrl}/f_avif,q_auto:good/${publicId}`,
                original: imageUrl
            };
        } catch (error) {
            console.error('❌ WebP variant creation error:', error);
            return { original: imageUrl };
        }
    }
}

/**
 * Express middleware for image optimization
 */
export const imageOptimizationMiddleware = (options = {}) => {
    const {
        field = 'image',
        generateSizes = ['thumbnail', 'medium'],
        folder = 'events'
    } = options;

    return async (req, res, next) => {
        try {
            if (!req.files || !req.files[field]) {
                return next();
            }

            const file = req.files[field];

            // Validate image type
            if (!file.mimetype.startsWith('image/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Please upload an image.'
                });
            }

            // Optimize image
            const optimizedImages = await ImageOptimizer.optimizeImage(
                file.data,
                { generateSizes }
            );

            // Upload to Cloudinary
            const uploadResult = await ImageOptimizer.uploadOptimizedImages(
                optimizedImages,
                folder
            );

            // Store results in request for later use
            req.optimizedImages = {
                urls: uploadResult.urls,
                details: uploadResult.details,
                originalUrl: uploadResult.urls.medium || uploadResult.urls.large
            };

            next();
        } catch (error) {
            console.error('❌ Image optimization middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Image processing failed'
            });
        }
    };
};

/**
 * Lazy loading image component generator
 */
export class LazyImageHelper {
    static generateImageMarkup(imageUrls, alt = '', className = '') {
        if (!imageUrls || typeof imageUrls === 'string') {
            // Fallback for old single URL format
            return `<img src="${imageUrls}" alt="${alt}" class="${className}" loading="lazy" />`;
        }

        const webpUrls = Object.entries(imageUrls)
            .map(([size, url]) => {
                const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                return { size, url: webpUrl };
            })
            .sort((a, b) => {
                const sizeOrder = { thumbnail: 1, medium: 2, large: 3 };
                return (sizeOrder[a.size] || 4) - (sizeOrder[b.size] || 4);
            });

        const srcSet = webpUrls
            .map(({ size, url }) => {
                const config = IMAGE_CONFIG[size];
                return config ? `${url} ${config.width}w` : null;
            })
            .filter(Boolean)
            .join(', ');

        const sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

        return `
      <picture>
        <source 
          srcset="${srcSet}" 
          sizes="${sizes}" 
          type="image/webp"
        />
        <img 
          src="${imageUrls.medium || imageUrls.large || imageUrls.thumbnail}" 
          alt="${alt}" 
          class="${className}"
          loading="lazy"
          decoding="async"
        />
      </picture>
    `;
    }

    static generateBackgroundImageCSS(imageUrls, size = 'large') {
        const url = imageUrls[size] || imageUrls.medium || imageUrls.thumbnail;
        return url ? `background-image: url('${url}');` : '';
    }
}

/**
 * Image cleanup utility
 */
export class ImageCleanup {
    static async deleteCloudinaryImages(publicIds) {
        try {
            if (!Array.isArray(publicIds)) {
                publicIds = [publicIds];
            }

            const deletePromises = publicIds.map(publicId =>
                cloudinary.uploader.destroy(publicId)
            );

            const results = await Promise.all(deletePromises);

            const successCount = results.filter(r => r.result === 'ok').length;
            console.log(`✅ Deleted ${successCount}/${publicIds.length} images from Cloudinary`);

            return { success: successCount, total: publicIds.length };
        } catch (error) {
            console.error('❌ Image cleanup error:', error);
            return { success: 0, total: publicIds.length };
        }
    }

    static async cleanupUnusedImages() {
        try {
            // Get all image URLs from database
            const Event = await import('../models/event.model.js');
            const Club = await import('../models/club.model.js');
            const User = await import('../models/user.model.js');

            const usedImages = new Set();

            // Collect image URLs from events
            const events = await Event.default.find({}, 'image').lean();
            events.forEach(event => {
                if (event.image) usedImages.add(event.image);
            });

            // Collect image URLs from clubs
            const clubs = await Club.default.find({}, 'image logo').lean();
            clubs.forEach(club => {
                if (club.image) usedImages.add(club.image);
                if (club.logo) usedImages.add(club.logo);
            });

            // Collect avatar URLs from users
            const users = await User.default.find({}, 'avatar').lean();
            users.forEach(user => {
                if (user.avatar) usedImages.add(user.avatar);
            });

            // Get all Cloudinary resources
            const cloudinaryResources = await cloudinary.api.resources({
                type: 'upload',
                max_results: 500
            });

            // Find unused resources
            const unusedResources = cloudinaryResources.resources.filter(resource => {
                return !usedImages.has(resource.secure_url);
            });

            console.log(`Found ${unusedResources.length} unused images`);

            // Delete unused resources (be careful with this in production)
            if (process.env.NODE_ENV !== 'production' && unusedResources.length > 0) {
                const publicIds = unusedResources.map(r => r.public_id);
                return await this.deleteCloudinaryImages(publicIds);
            }

            return { success: 0, total: unusedResources.length, message: 'Cleanup disabled in production' };
        } catch (error) {
            console.error('❌ Unused image cleanup error:', error);
            return { success: 0, total: 0, error: error.message };
        }
    }
}

export default ImageOptimizer;