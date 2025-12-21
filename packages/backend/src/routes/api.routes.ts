// Main API Router with Versioning
// Organizes all API routes with proper versioning

import { Router, type Request, type Response } from 'express';
import { ApiResponse } from '@event-management/shared';
import {
  createVersionedRouter,
  createVersionInfoRouter,
  versionCompatibility,
  contentNegotiation,
  formatResponse,
} from '../utils/apiVersioning.js';

// Import route modules (will be created/updated)
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import eventRoutes from './event.routes.js';
import clubRoutes from './club.routes.js';
import adminRoutes from './admin.routes.js';
import moderatorRoutes from './moderator.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import devRoutes from './dev.routes.js';
import uploadRoutes from './upload.routes.js';
import announcementRoutes from './announcement.routes.js';
import recruitmentRoutes from './recruitment.routes.js';
import { isDevelopment } from '../configs/env.config.js';
import { v2 } from 'cloudinary';

/**
 * Main API router with versioning support
 */
export function createApiRouter(): Router {
  const apiRouter = Router();

  // Apply global API middleware
  apiRouter.use(contentNegotiation());
  apiRouter.use(formatResponse());
  // the below GET request points to /api/
  // API information endpoint
  apiRouter.get('/', (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      message: 'Event Management Portal API',
      data: {
        name: 'Event Management Portal API',
        version: '1.0.0',
        description:
          'A comprehensive API for managing events, clubs, and user registrations',
        documentation: '/api-docs',
        supportedVersions: ['v1'],
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          events: '/api/v1/events',
          clubs: '/api/v1/clubs',
          admin: '/api/v1/admin',
        },
        features: [
          'User authentication and authorization',
          'Event management and registration',
          'Club management and membership',
          'File upload and media management',
          'Real-time notifications',
          'Administrative controls',
        ],
      },
    };
    res.json(response);
  });

  // Version information endpoint
  apiRouter.use('/versions', createVersionInfoRouter());

  // API v1 routes
  const v1Router = createVersionedRouter('v1');
  // Apply version compatibility only to v1 routes (keep root info endpoints free of version checks)
  v1Router.use(versionCompatibility(['v1']));

  // Authentication routes
  v1Router.use('/auth', authRoutes);

  // User management routes
  v1Router.use('/users', userRoutes);

  // Event management routes
  v1Router.use('/events', eventRoutes);

  // File uploads (server-side Cloudinary proxy)
  v1Router.use('/uploads', uploadRoutes);

  // Club management routes
  v1Router.use('/clubs', clubRoutes);

  // Announcements routes
  v1Router.use('/announcements', announcementRoutes);

  // Recruitment routes
  v1Router.use('/recruitments', recruitmentRoutes);

  // Admin routes
  v1Router.use('/admin', adminRoutes);

  // Moderator routes
  v1Router.use('/moderator', moderatorRoutes);

  // Dashboard routes
  v1Router.use('/dashboard', dashboardRoutes);

  // Development routes (only mounted in development)
  if (isDevelopment) {
    v1Router.use('/dev', devRoutes);
  }

  // Temporary placeholder routes for v1
  v1Router.get('/', (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      message: 'Event Management Portal API v1',
      data: {
        version: 'v1',
        status: 'active',
        endpoints: [
          'GET /api/v1/health - Health check',
          'POST /api/v1/auth/register - User registration',
          'POST /api/v1/auth/login - User login',
          'GET /api/v1/events - List events',
          'GET /api/v1/clubs - List clubs',
          // More endpoints will be added as routes are implemented
        ],
        documentation: '/api-docs',
      },
    };
    res.json(response);
  });

  // Mount v1 router
  apiRouter.use('/v1', v1Router);
  apiRouter.use('/v2/', createV2Router());

  // Default version redirect (v1) so that we can access v1 routes via /api/auth, /api/users, etc. and not just /api/v1/auth thats why we created v1Router above
  apiRouter.use('/auth', (req, res, next) => {
    req.url = `/v1/auth${req.url}`;
    next();
  });

  apiRouter.use('/users', (req, res, next) => {
    req.url = `/v1/users${req.url}`;
    next();
  });

  apiRouter.use('/events', (req, res, next) => {
    req.url = `/v1/events${req.url}`;
    next();
  });

  apiRouter.use('/clubs', (req, res, next) => {
    req.url = `/v1/clubs${req.url}`;
    next();
  });

  apiRouter.use('/uploads', (req, res, next) => {
    req.url = `/v1/uploads${req.url}`;
    next();
  });

  apiRouter.use('/announcements', (req, res, next) => {
    req.url = `/v1/announcements${req.url}`;
    next();
  });

  apiRouter.use('/recruitments', (req, res, next) => {
    req.url = `/v1/recruitments${req.url}`;
    next();
  });

  apiRouter.use('/admin', (req, res, next) => {
    req.url = `/v1/admin${req.url}`;
    next();
  });

  return apiRouter;
}

/**
 * Future API versions can be added here
 */
export function createV2Router(): Router {
  // Create v2 router
  const v2Router = createVersionedRouter('v2');

  // V2 specific features and routes would go here
  v2Router.get('/', (req, res) => {
    const routes = v2Router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods).map((m) =>
          m.toUpperCase()
        );
        return { path, methods };
      });
    const response: ApiResponse = {
      success: true,
      message: 'Event Management Portal API v2',
      data: {
        version: 'v2',
        status: 'development',
        newFeatures: [
          'GraphQL endpoints',
          'Advanced filtering and search',
          'Bulk operations',
          'Real-time subscriptions',
          'Enhanced file upload',
        ],
        endpoints: routes,
        note: 'This version is under development',
      },
    };
    res.json(response);
  });

  return v2Router;
}

export default createApiRouter;
