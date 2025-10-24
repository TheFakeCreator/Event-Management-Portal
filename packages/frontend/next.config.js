/** @type {import('next').NextConfig} */
const nextConfig = {
    // ESLint configuration - treat warnings as warnings, not errors
    eslint: {
        // Allow warnings during build but still fail on errors
        ignoreDuringBuilds: false,
    },
    // Enable webpack bundle analyzer in development
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Bundle analyzer
        if (process.env.ANALYZE) {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'server',
                    analyzerPort: isServer ? 8888 : 8889,
                    openAnalyzer: true,
                })
            );
        }

        // Tree shaking optimization (only in production to avoid conflicts)
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                sideEffects: false,
            };
        }

        // Code splitting optimization (merge with existing config)
        if (!isServer) {
            config.optimization.splitChunks = {
                ...config.optimization.splitChunks,
                chunks: 'all',
                cacheGroups: {
                    ...config.optimization.splitChunks?.cacheGroups,
                    // Vendor chunks
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10,
                    },
                    // UI components chunk
                    ui: {
                        test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
                        name: 'ui',
                        chunks: 'all',
                        priority: 20,
                    },
                    // Form components chunk
                    forms: {
                        test: /[\\/]src[\\/]components[\\/]forms[\\/]/,
                        name: 'forms',
                        chunks: 'async',
                        priority: 15,
                    },
                    // Layout components chunk
                    layout: {
                        test: /[\\/]src[\\/]components[\\/]layout[\\/]/,
                        name: 'layout',
                        chunks: 'all',
                        priority: 15,
                    },
                    // Shared utilities chunk
                    shared: {
                        test: /[\\/]packages[\\/]shared[\\/]/,
                        name: 'shared',
                        chunks: 'all',
                        priority: 25,
                    },
                },
            };
        }

        return config;
    },

    // Enable experimental features for better performance
    experimental: {
        // Remove optimizeCss as it requires critters package
        // optimizeCss: true,
        optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    },

    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Image optimization
    images: {
        domains: ['res.cloudinary.com'],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 31536000, // 1 year
    },

    // Enable compression
    compress: true,

    // PWA and performance optimizations
    headers: async () => [
        {
            source: '/(.*)',
            headers: [
                {
                    key: 'X-DNS-Prefetch-Control',
                    value: 'on'
                },
                {
                    key: 'Strict-Transport-Security',
                    value: 'max-age=31536000; includeSubDomains'
                },
                {
                    key: 'X-Frame-Options',
                    value: 'SAMEORIGIN'
                }
            ],
        },
    ],
};

module.exports = nextConfig;