import compression from 'compression';
import { minify } from 'html-minifier';
import { createHash } from 'crypto';

/**
 * Advanced compression middleware with intelligent compression strategies
 */
export class CompressionOptimizer {
    /**
     * Create compression middleware with optimized settings
     */
    static createCompressionMiddleware() {
        return compression({
            // Compression level (1-9, 6 is default)
            level: 6,

            // Only compress responses larger than 1KB
            threshold: 1024,

            // Intelligent filtering based on content type and size
            filter: (req, res) => {
                // Don't compress if client doesn't support it
                if (!req.headers['accept-encoding']) {
                    return false;
                }

                // Skip compression for already compressed content
                const contentType = res.getHeader('content-type') || '';
                if (contentType.includes('image/') ||
                    contentType.includes('video/') ||
                    contentType.includes('audio/') ||
                    contentType.includes('application/pdf') ||
                    contentType.includes('application/zip')) {
                    return false;
                }

                // Only compress text-based content
                if (contentType.includes('text/') ||
                    contentType.includes('application/json') ||
                    contentType.includes('application/javascript') ||
                    contentType.includes('application/xml') ||
                    contentType.includes('text/html')) {
                    return true;
                }

                return false;
            },

            // Memory level for compression (1-9)
            memLevel: 8,

            // Compression strategy
            strategy: compression.constants.Z_DEFAULT_STRATEGY
        });
    }

    /**
     * Brotli compression for modern browsers
     */
    static createBrotliMiddleware() {
        return (req, res, next) => {
            const acceptEncoding = req.headers['accept-encoding'] || '';

            if (acceptEncoding.includes('br')) {
                // Set Brotli compression headers
                res.set('Content-Encoding', 'br');
                res.set('Vary', 'Accept-Encoding');
            }

            next();
        };
    }
}

/**
 * HTML minification middleware
 */
export const htmlMinificationMiddleware = (options = {}) => {
    const minifyOptions = {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
        ...options
    };

    return (req, res, next) => {
        // Only process HTML responses
        if (!res.getHeader('content-type')?.includes('text/html')) {
            return next();
        }

        // Store original render method
        const originalRender = res.render;

        res.render = function (view, locals, callback) {
            // Use original render but capture the HTML
            const originalSend = res.send;

            res.send = function (html) {
                if (typeof html === 'string' && html.trim().startsWith('<!')) {
                    try {
                        // Minify HTML
                        const minified = minify(html, minifyOptions);

                        // Calculate compression ratio
                        const originalSize = Buffer.byteLength(html, 'utf8');
                        const minifiedSize = Buffer.byteLength(minified, 'utf8');
                        const ratio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

                        console.log(`📦 HTML minified: ${originalSize} → ${minifiedSize} bytes (${ratio}% reduction)`);

                        // Set compression headers
                        res.set({
                            'X-Minified': 'true',
                            'X-Original-Size': originalSize.toString(),
                            'X-Minified-Size': minifiedSize.toString(),
                            'X-Compression-Ratio': `${ratio}%`
                        });

                        return originalSend.call(this, minified);
                    } catch (error) {
                        console.error('❌ HTML minification error:', error);
                        return originalSend.call(this, html);
                    }
                }

                return originalSend.call(this, html);
            };

            return originalRender.call(this, view, locals, callback);
        };

        next();
    };
};

/**
 * Static asset optimization
 */
export class AssetOptimizer {
    /**
     * Create etag for static assets
     */
    static generateETag(content) {
        return createHash('md5').update(content).digest('hex').substring(0, 16);
    }

    /**
     * Static asset caching middleware
     */
    static createAssetCacheMiddleware() {
        return (req, res, next) => {
            // Only handle static assets
            if (!req.path.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$/)) {
                return next();
            }

            // Set cache headers based on file type
            const ext = req.path.split('.').pop().toLowerCase();
            let maxAge = 0;

            switch (ext) {
                case 'css':
                case 'js':
                    maxAge = 31536000; // 1 year for CSS/JS
                    break;
                case 'png':
                case 'jpg':
                case 'jpeg':
                case 'gif':
                case 'webp':
                case 'svg':
                    maxAge = 2592000; // 30 days for images
                    break;
                case 'woff':
                case 'woff2':
                case 'ttf':
                    maxAge = 31536000; // 1 year for fonts
                    break;
                case 'ico':
                    maxAge = 86400; // 1 day for favicon
                    break;
                default:
                    maxAge = 3600; // 1 hour default
            }

            // Set caching headers
            res.set({
                'Cache-Control': `public, max-age=${maxAge}`,
                'Expires': new Date(Date.now() + maxAge * 1000).toUTCString()
            });

            // Handle conditional requests
            const ifNoneMatch = req.headers['if-none-match'];
            if (ifNoneMatch) {
                // Generate ETag for comparison (simplified)
                const etag = `"${Date.now()}"`;
                res.set('ETag', etag);

                if (ifNoneMatch === etag) {
                    return res.status(304).end();
                }
            }

            next();
        };
    }

    /**
     * Preload critical resources
     */
    static createResourceHintsMiddleware() {
        return (req, res, next) => {
            // Only for HTML requests
            if (!req.path.endsWith('/') && !req.path.endsWith('.html')) {
                return next();
            }

            // Add resource hints for critical assets
            const hints = [
                '</css/main.css>; rel=preload; as=style',
                '</js/main.js>; rel=preload; as=script',
                '</images/logo.webp>; rel=preload; as=image',
                '//fonts.googleapis.com; rel=preconnect; crossorigin',
                '//cdnjs.cloudflare.com; rel=dns-prefetch'
            ];

            res.set('Link', hints.join(', '));
            next();
        };
    }
}

/**
 * Bundle optimization for JavaScript and CSS
 */
export class BundleOptimizer {
    /**
     * Combine and minify CSS files
     */
    static async combineCSS(cssFiles) {
        try {
            const CleanCSS = await import('clean-css');
            const cleanCSS = new CleanCSS.default({
                level: 2,
                returnPromise: true
            });

            const combinedCSS = cssFiles.join('\n');
            const result = await cleanCSS.minify(combinedCSS);

            return {
                css: result.styles,
                originalSize: Buffer.byteLength(combinedCSS),
                minifiedSize: Buffer.byteLength(result.styles),
                savings: result.stats ? result.stats.minifiedSize : 0
            };
        } catch (error) {
            console.error('❌ CSS optimization error:', error);
            return { css: cssFiles.join('\n') };
        }
    }

    /**
     * Minify JavaScript
     */
    static async minifyJS(jsCode) {
        try {
            const UglifyJS = await import('uglify-js');

            const result = UglifyJS.default.minify(jsCode, {
                compress: {
                    drop_console: process.env.NODE_ENV === 'production',
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.info']
                },
                mangle: true,
                output: {
                    comments: false
                }
            });

            if (result.error) {
                throw result.error;
            }

            return {
                code: result.code,
                originalSize: Buffer.byteLength(jsCode),
                minifiedSize: Buffer.byteLength(result.code)
            };
        } catch (error) {
            console.error('❌ JS minification error:', error);
            return { code: jsCode };
        }
    }

    /**
     * Create bundled asset middleware
     */
    static createBundleMiddleware(bundles = {}) {
        return async (req, res, next) => {
            const bundleName = req.path.replace('/bundles/', '').replace(/\.(css|js)$/, '');
            const bundle = bundles[bundleName];

            if (!bundle) {
                return next();
            }

            try {
                const ext = req.path.split('.').pop();
                let content, contentType;

                if (ext === 'css') {
                    const result = await this.combineCSS(bundle.files);
                    content = result.css;
                    contentType = 'text/css';
                } else if (ext === 'js') {
                    const combinedJS = bundle.files.join('\n');
                    const result = await this.minifyJS(combinedJS);
                    content = result.code;
                    contentType = 'application/javascript';
                } else {
                    return next();
                }

                // Set appropriate headers
                res.set({
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000', // 1 year
                    'X-Bundle': bundleName,
                    'X-Generated': new Date().toISOString()
                });

                res.send(content);
            } catch (error) {
                console.error('❌ Bundle generation error:', error);
                next();
            }
        };
    }
}

/**
 * Performance optimization middleware factory
 */
export const createOptimizationMiddleware = (options = {}) => {
    const {
        enableCompression = true,
        enableMinification = true,
        enableAssetCaching = true,
        enableResourceHints = true,
        compressionLevel = 6
    } = options;

    const middlewares = [];

    if (enableResourceHints) {
        middlewares.push(AssetOptimizer.createResourceHintsMiddleware());
    }

    if (enableAssetCaching) {
        middlewares.push(AssetOptimizer.createAssetCacheMiddleware());
    }

    if (enableCompression) {
        middlewares.push(CompressionOptimizer.createCompressionMiddleware());
    }

    if (enableMinification) {
        middlewares.push(htmlMinificationMiddleware());
    }

    return middlewares;
};

export default {
    CompressionOptimizer,
    AssetOptimizer,
    BundleOptimizer,
    htmlMinificationMiddleware,
    createOptimizationMiddleware
};