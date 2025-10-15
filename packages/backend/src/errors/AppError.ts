// Custom Error Classes
// Typed error classes for better error handling and logging

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    errorCode?: string,
    details?: Record<string, any>
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON-serializable format
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.constructor.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(
    errors: Record<string, string[]>,
    message: string = 'Validation failed'
  ) {
    super(message, 400, true, 'VALIDATION_ERROR', { errors });
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    errorCode: string = 'AUTH_REQUIRED'
  ) {
    super(message, 401, true, errorCode);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    errorCode: string = 'INSUFFICIENT_PERMISSIONS'
  ) {
    super(message, 403, true, errorCode);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  public readonly resource: string;

  constructor(resource: string, message?: string) {
    const errorMessage = message || `${resource} not found`;
    super(errorMessage, 404, true, 'RESOURCE_NOT_FOUND', { resource });
    this.resource = resource;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  public readonly conflictField: string;

  constructor(field: string, message?: string) {
    const errorMessage = message || `Conflict detected in field: ${field}`;
    super(errorMessage, 409, true, 'RESOURCE_CONFLICT', { field });
    this.conflictField = field;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60, message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = 'Internal server error',
    details?: Record<string, any>
  ) {
    super(message, 500, false, 'INTERNAL_ERROR', details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  public readonly operation: string;

  constructor(
    operation: string,
    message?: string,
    details?: Record<string, any>
  ) {
    const errorMessage = message || `Database operation failed: ${operation}`;
    super(errorMessage, 500, false, 'DATABASE_ERROR', {
      operation,
      ...details,
    });
    this.operation = operation;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * External service error (502/503)
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message?: string, statusCode: number = 502) {
    const errorMessage = message || `External service error: ${service}`;
    super(errorMessage, statusCode, true, 'EXTERNAL_SERVICE_ERROR', {
      service,
    });
    this.service = service;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * File upload error (400)
 */
export class FileUploadError extends AppError {
  public readonly fileName?: string;

  constructor(message: string, fileName?: string) {
    super(message, 400, true, 'FILE_UPLOAD_ERROR', { fileName });
    this.fileName = fileName;
    Object.setPrototypeOf(this, FileUploadError.prototype);
  }
}

/**
 * Business logic error (422)
 */
export class BusinessLogicError extends AppError {
  public readonly businessRule: string;

  constructor(businessRule: string, message?: string) {
    const errorMessage = message || `Business rule violation: ${businessRule}`;
    super(errorMessage, 422, true, 'BUSINESS_RULE_VIOLATION', { businessRule });
    this.businessRule = businessRule;
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

/**
 * Email service error
 */
export class EmailError extends ExternalServiceError {
  constructor(message: string = 'Email service error') {
    super('Email Service', message, 502);
    Object.setPrototypeOf(this, EmailError.prototype);
  }
}

/**
 * Cloudinary error
 */
export class CloudinaryError extends ExternalServiceError {
  constructor(message: string = 'Cloudinary service error') {
    super('Cloudinary', message, 502);
    Object.setPrototypeOf(this, CloudinaryError.prototype);
  }
}

/**
 * JWT token error
 */
export class TokenError extends AuthenticationError {
  public readonly tokenType: 'access' | 'refresh' | 'verification' | 'reset';

  constructor(
    tokenType: 'access' | 'refresh' | 'verification' | 'reset',
    message?: string
  ) {
    const errorMessage = message || `Invalid ${tokenType} token`;
    super(errorMessage, `INVALID_${tokenType.toUpperCase()}_TOKEN`);
    this.tokenType = tokenType;
    Object.setPrototypeOf(this, TokenError.prototype);
  }
}

/**
 * Type guard to check if an error is an operational error
 */
export function isOperationalError(error: Error): error is AppError {
  return error instanceof AppError && error.isOperational;
}

/**
 * Error factory functions for common scenarios
 */
export const ErrorFactory = {
  userNotFound: (userId?: string) =>
    new NotFoundError(
      'User',
      userId ? `User with ID ${userId} not found` : undefined
    ),

  eventNotFound: (eventId?: string) =>
    new NotFoundError(
      'Event',
      eventId ? `Event with ID ${eventId} not found` : undefined
    ),

  clubNotFound: (clubId?: string) =>
    new NotFoundError(
      'Club',
      clubId ? `Club with ID ${clubId} not found` : undefined
    ),

  duplicateEmail: (email: string) =>
    new ConflictError('email', `Email ${email} is already registered`),

  invalidCredentials: () =>
    new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS'),

  emailNotVerified: () =>
    new AuthenticationError('Email not verified', 'EMAIL_NOT_VERIFIED'),

  accountSuspended: () =>
    new AuthorizationError('Account has been suspended', 'ACCOUNT_SUSPENDED'),

  eventFull: () =>
    new BusinessLogicError('EVENT_FULL', 'Event has reached maximum capacity'),

  eventAlreadyStarted: () =>
    new BusinessLogicError(
      'EVENT_STARTED',
      'Cannot register for an event that has already started'
    ),

  alreadyRegistered: () =>
    new ConflictError('registration', 'Already registered for this event'),

  invalidFileType: (allowedTypes: string[]) =>
    new FileUploadError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    ),

  fileTooLarge: (maxSize: number) =>
    new FileUploadError(`File too large. Maximum size: ${maxSize}MB`),

  insufficientPermissions: (requiredRole: string) =>
    new AuthorizationError(
      `Requires ${requiredRole} role`,
      'INSUFFICIENT_ROLE'
    ),

  tokenExpired: (tokenType: 'access' | 'refresh' | 'verification' | 'reset') =>
    new TokenError(tokenType, `${tokenType} token has expired`),

  invalidToken: (tokenType: 'access' | 'refresh' | 'verification' | 'reset') =>
    new TokenError(tokenType, `Invalid ${tokenType} token`),

  databaseConnection: () =>
    new DatabaseError('connection', 'Failed to connect to database'),

  emailDelivery: () => new EmailError('Failed to send email'),

  cloudinaryUpload: () =>
    new CloudinaryError('Failed to upload file to Cloudinary'),
};
