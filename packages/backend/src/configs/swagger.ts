// Swagger/OpenAPI Configuration
// Provides comprehensive API documentation for the Event Management Portal

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * Swagger configuration options
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management Portal API',
      version: '1.0.0',
      description:
        'A comprehensive API for managing events, clubs, and user registrations',
      contact: {
        name: 'Event Management Portal Team',
        email: 'support@eventmanagement.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://api.eventmanagement.com/api/v1'
            : 'http://localhost:3000/api/v1',
        description:
          process.env.NODE_ENV === 'production'
            ? 'Production Server'
            : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
      schemas: {
        // Common schemas
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
            },
            message: {
              type: 'string',
              description: 'Human-readable response message',
            },
            data: {
              description: 'Response data (varies by endpoint)',
            },
            error: {
              type: 'string',
              description: 'Error message if success is false',
            },
            errors: {
              type: 'object',
              description: 'Field-specific validation errors',
              additionalProperties: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
          required: ['success', 'message'],
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User unique identifier',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              description: 'User role in the system',
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Whether the user email is verified',
            },
            profilePicture: {
              type: 'string',
              description: 'URL to user profile picture',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User registration timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last profile update timestamp',
            },
          },
          required: ['_id', 'firstName', 'lastName', 'email', 'role'],
        },

        UserRegistration: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User last name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (must meet strength requirements)',
            },
          },
          required: ['firstName', 'lastName', 'email', 'password'],
        },

        UserLogin: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              description: 'User password',
            },
          },
          required: ['email', 'password'],
        },

        // Event schemas
        Event: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Event unique identifier',
            },
            title: {
              type: 'string',
              description: 'Event title',
            },
            description: {
              type: 'string',
              description: 'Event description',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Event start date and time',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Event end date and time',
            },
            location: {
              type: 'string',
              description: 'Event location',
            },
            maxParticipants: {
              type: 'number',
              minimum: 1,
              description: 'Maximum number of participants',
            },
            registeredParticipants: {
              type: 'number',
              minimum: 0,
              description: 'Current number of registered participants',
            },
            imageUrl: {
              type: 'string',
              description: 'Event banner image URL',
            },
            club: {
              $ref: '#/components/schemas/Club',
              description: 'Club organizing the event',
            },
            createdBy: {
              $ref: '#/components/schemas/User',
              description: 'User who created the event',
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
              description: 'Current event status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Event creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last event update timestamp',
            },
          },
          required: [
            '_id',
            'title',
            'description',
            'startDate',
            'endDate',
            'location',
            'maxParticipants',
          ],
        },

        EventCreate: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Event title',
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 1000,
              description: 'Event description',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Event start date and time',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Event end date and time',
            },
            location: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              description: 'Event location',
            },
            maxParticipants: {
              type: 'number',
              minimum: 1,
              maximum: 10000,
              description: 'Maximum number of participants',
            },
            clubId: {
              type: 'string',
              description: 'ID of the club organizing the event',
            },
          },
          required: [
            'title',
            'description',
            'startDate',
            'endDate',
            'location',
            'maxParticipants',
            'clubId',
          ],
        },

        // Club schemas
        Club: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Club unique identifier',
            },
            name: {
              type: 'string',
              description: 'Club name',
            },
            description: {
              type: 'string',
              description: 'Club description',
            },
            logoUrl: {
              type: 'string',
              description: 'Club logo URL',
            },
            contactEmail: {
              type: 'string',
              format: 'email',
              description: 'Club contact email',
            },
            socialLinks: {
              type: 'object',
              properties: {
                website: { type: 'string' },
                facebook: { type: 'string' },
                twitter: { type: 'string' },
                instagram: { type: 'string' },
                linkedin: { type: 'string' },
              },
              description: 'Club social media links',
            },
            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User',
              },
              description: 'Club members',
            },
            createdBy: {
              $ref: '#/components/schemas/User',
              description: 'User who created the club',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Club creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last club update timestamp',
            },
          },
          required: ['_id', 'name', 'description', 'contactEmail'],
        },

        // Error schemas
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              example: {
                email: ['Email is required', 'Email must be valid'],
                password: ['Password must be at least 8 characters long'],
              },
            },
          },
        },

        AuthenticationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Authentication required',
            },
            error: {
              type: 'string',
              example: 'Invalid or missing authentication token',
            },
          },
        },

        NotFoundError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Resource not found',
            },
            error: {
              type: 'string',
              example: 'The requested resource could not be found',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Path to route files for JSDoc comments
    './src/controllers/*.ts', // Path to controller files for JSDoc comments
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Setup Swagger documentation middleware
 */
export function setupSwagger(app: any): void {
  // Swagger UI setup
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Event Management Portal API Documentation',
      swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: false,
      },
    })
  );

  // JSON endpoint for the raw spec
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

/**
 * Common Swagger responses for reuse in route documentation
 */
export const SwaggerResponses = {
  Success: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ApiResponse',
          },
        },
      },
    },
  },

  Created: {
    201: {
      description: 'Resource created successfully',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ApiResponse',
          },
        },
      },
    },
  },

  ValidationError: {
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ValidationError',
          },
        },
      },
    },
  },

  AuthenticationError: {
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/AuthenticationError',
          },
        },
      },
    },
  },

  AuthorizationError: {
    403: {
      description: 'Insufficient permissions',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/AuthenticationError',
          },
        },
      },
    },
  },

  NotFound: {
    404: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/NotFoundError',
          },
        },
      },
    },
  },

  ServerError: {
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ApiResponse',
          },
          example: {
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong on the server',
          },
        },
      },
    },
  },
} as const;
