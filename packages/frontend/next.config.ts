import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable standalone output for development
  // output: 'standalone',

  // Image optimization
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add any custom webpack config here
    return config;
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // API rewrites to proxy to backend
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/admin/:path*',
          destination: 'http://localhost:3000/api/v1/admin/:path*',
        },
        {
          source: '/api/dashboard/:path*',
          destination: 'http://localhost:3000/api/v1/dashboard/:path*',
        },
        {
          source: '/api/events/:path*',
          destination: 'http://localhost:3000/api/v1/events/:path*',
        },
        {
          source: '/api/clubs/:path*',
          destination: 'http://localhost:3000/api/v1/clubs/:path*',
        },
        {
          source: '/api/users/:path*',
          destination: 'http://localhost:3000/api/v1/users/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
