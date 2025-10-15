import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@event-management/shared';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  isOperationalError,
} from '../errors/AppError.js';
import { logSecurityEvent, SECURITY_EVENTS } from '../utils/securityLogger.js';
import { isDevelopment } from '../configs/env.config.js';

/**
 * Enhanced error handler with proper TypeScript types
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  console.error('Error occurred:', {
    name: err.constructor.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Security logging for authentication/authorization errors
  if (err instanceof AuthenticationError || err instanceof AuthorizationError) {
    logSecurityEvent(
      SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
      {
        error: err.message,
        errorCode: err.errorCode,
        endpoint: `${req.method} ${req.path}`,
      },
      req as any
    );
  }

  // Handle specific error types
  let response: ApiResponse;
  let statusCode: number;

  if (err instanceof ValidationError) {
    statusCode = 400;
    response = {
      success: false,
      message: err.message,
      errors: err.errors,
    };
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    response = {
      success: false,
      message: err.message,
      error: err.errorCode || 'AUTHENTICATION_REQUIRED',
    };
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    response = {
      success: false,
      message: err.message,
      error: err.errorCode || 'INSUFFICIENT_PERMISSIONS',
    };
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    response = {
      success: false,
      message: err.message,
      error: 'RESOURCE_NOT_FOUND',
    };
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    response = {
      success: false,
      message: err.message,
      error: 'RESOURCE_CONFLICT',
    };
  } else if (err instanceof RateLimitError) {
    statusCode = 429;
    response = {
      success: false,
      message: err.message,
      error: 'RATE_LIMIT_EXCEEDED',
    };
    // Add retry-after header
    res.set('Retry-After', err.retryAfter.toString());
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
    response = {
      success: false,
      message: 'Database operation failed',
      error: isDevelopment ? err.message : 'DATABASE_ERROR',
    };
  } else if (err instanceof ExternalServiceError) {
    statusCode = err.statusCode;
    response = {
      success: false,
      message: 'External service error',
      error: isDevelopment ? err.message : 'EXTERNAL_SERVICE_ERROR',
    };
  } else if (err instanceof AppError) {
    // Generic AppError handling
    statusCode = err.statusCode;
    response = {
      success: false,
      message: err.message,
      error: err.errorCode || 'APPLICATION_ERROR',
    };
  } else {
    // Unknown/unhandled errors
    statusCode = 500;
    response = {
      success: false,
      message: 'Internal server error',
      error: isDevelopment ? err.message : 'INTERNAL_ERROR',
    };

    // Log critical errors for investigation
    console.error('CRITICAL: Unhandled error:', {
      error: err,
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      },
    });
  }

  // Add error details in development mode (temporarily commented out for type safety)
  // if (isDevelopment && err instanceof AppError && err.details) {
  //     response.details = err.details;
  // }

  // Send the response
  res.status(statusCode).json(response);
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: 'Endpoint not found',
    error: `Cannot ${req.method} ${req.originalUrl}`,
  };
  res.status(404).json(response);
};

/**
 * Async error handler wrapper
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
