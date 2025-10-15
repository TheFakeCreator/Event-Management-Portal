// API Versioning Router
// Provides proper API versioning structure for the Event Management Portal

import { Router } from 'express';
import { ApiResponse } from '@event-management/shared';

/**
 * Create versioned API router
 */
export function createVersionedRouter(version: string): Router {
  const router = Router();

  // Add version information to all responses in this router
  router.use((req, res, next) => {
    // Add version header to response
    res.set('API-Version', version);

    // Store version in response locals for access in controllers
    res.locals.apiVersion = version;

    next();
  });

  // Version-specific health check
  router.get('/health', (req, res) => {
    const response: ApiResponse = {
      success: true,
      message: `API ${version} is running successfully`,
      data: {
        version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
    res.json(response);
  });

  return router;
}

/**
 * API version compatibility middleware
 */
export function versionCompatibility(supportedVersions: string[]) {
  return (req: any, res: any, next: any) => {
    const requestedVersion =
      req.headers['api-version'] || req.query.version || 'v1';

    if (!supportedVersions.includes(requestedVersion)) {
      const response: ApiResponse = {
        success: false,
        message: 'Unsupported API version',
        error: `Requested version '${requestedVersion}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
      };
      return res.status(400).json(response);
    }

    // Store requested version for use in controllers
    req.apiVersion = requestedVersion;
    next();
  };
}

/**
 * Deprecation warning middleware
 */
export function deprecationWarning(
  version: string,
  deprecationDate: string,
  sunsetDate?: string
) {
  return (req: any, res: any, next: any) => {
    const warningMessage = `API ${version} is deprecated as of ${deprecationDate}`;
    const sunsetMessage = sunsetDate
      ? ` and will be removed on ${sunsetDate}`
      : '';

    res.set('Deprecation', deprecationDate);
    res.set('Warning', `299 - "${warningMessage}${sunsetMessage}"`);

    if (sunsetDate) {
      res.set('Sunset', sunsetDate);
    }

    next();
  };
}

/**
 * Version-specific feature flags
 */
export interface VersionFeatures {
  enableAdvancedFiltering: boolean;
  enableBulkOperations: boolean;
  enableRealtimeNotifications: boolean;
  enableFileUpload: boolean;
  enableGraphQLEndpoints: boolean;
  maxRequestSize: string;
  rateLimitPerMinute: number;
}

export const versionFeatures: Record<string, VersionFeatures> = {
  v1: {
    enableAdvancedFiltering: true,
    enableBulkOperations: false,
    enableRealtimeNotifications: false,
    enableFileUpload: true,
    enableGraphQLEndpoints: false,
    maxRequestSize: '10mb',
    rateLimitPerMinute: 100,
  },
  v2: {
    enableAdvancedFiltering: true,
    enableBulkOperations: true,
    enableRealtimeNotifications: true,
    enableFileUpload: true,
    enableGraphQLEndpoints: true,
    maxRequestSize: '50mb',
    rateLimitPerMinute: 200,
  },
};

/**
 * Feature flag middleware
 */
export function featureFlag(feature: keyof VersionFeatures) {
  return (req: any, res: any, next: any) => {
    const version = req.apiVersion || 'v1';
    const features = versionFeatures[version];

    if (!features || !features[feature]) {
      const response: ApiResponse = {
        success: false,
        message: 'Feature not available',
        error: `Feature '${feature}' is not available in API ${version}`,
      };
      return res.status(404).json(response);
    }

    next();
  };
}

/**
 * Version info endpoint
 */
export function createVersionInfoRouter(): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const response: ApiResponse = {
      success: true,
      message: 'API Version Information',
      data: {
        currentVersion: 'v1',
        supportedVersions: ['v1'],
        deprecatedVersions: [],
        features: versionFeatures,
        endpoints: [
          '/api/v1 - Current stable API',
          '/api/versions - Version information',
        ],
      },
    };
    res.json(response);
  });

  return router;
}

/**
 * Content negotiation for different response formats
 */
export function contentNegotiation() {
  return (req: any, res: any, next: any) => {
    const acceptHeader = req.headers.accept || 'application/json';

    // Default to JSON for API responses
    if (!res.locals.responseFormat) {
      if (acceptHeader.includes('application/xml')) {
        res.locals.responseFormat = 'xml';
      } else if (acceptHeader.includes('application/yaml')) {
        res.locals.responseFormat = 'yaml';
      } else {
        res.locals.responseFormat = 'json';
      }
    }

    next();
  };
}

/**
 * API response formatter based on version and content type
 */
export function formatResponse() {
  return (req: any, res: any, next: any) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to add version information
    res.json = function (data: any) {
      const version = res.locals.apiVersion || 'v1';
      const format = res.locals.responseFormat || 'json';

      // Add metadata to response
      if (typeof data === 'object' && data !== null) {
        data._metadata = {
          version,
          timestamp: new Date().toISOString(),
          format,
        };
      }

      // Set appropriate content type
      switch (format) {
        case 'xml':
          res.set('Content-Type', 'application/xml');
          break;
        case 'yaml':
          res.set('Content-Type', 'application/yaml');
          break;
        default:
          res.set('Content-Type', 'application/json');
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
}
