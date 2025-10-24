// Comprehensive error handling utilities
import React from 'react';

export interface ApplicationError {
  name: string;
  message: string;
  code?: string;
  status?: number;
  context?: Record<string, any>;
  stack?: string;
  timestamp: number;
  id: string;
}

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly status?: number;
  public readonly context?: Record<string, any>;
  public readonly id: string;
  public readonly timestamp: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    status?: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.status = status;
    this.context = context;
    this.id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): ApplicationError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      context: this.context,
      stack: this.stack,
      timestamp: this.timestamp,
      id: this.id,
    };
  }
}

// Specific error classes
export class NetworkError extends AppError {
  constructor(
    message: string = 'Network request failed',
    status?: number,
    context?: Record<string, any>
  ) {
    super(message, ErrorType.NETWORK, 'NETWORK_ERROR', status, context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    field?: string,
    value?: any
  ) {
    const context = field ? { field, value } : undefined;
    super(message, ErrorType.VALIDATION, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorType.AUTHENTICATION, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorType.AUTHORIZATION, 'AUTHZ_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', resource?: string) {
    const context = resource ? { resource } : undefined;
    super(message, ErrorType.NOT_FOUND, 'NOT_FOUND', 404, context);
    this.name = 'NotFoundError';
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: ApplicationError) => void> = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Register error listener
  public addErrorListener(listener: (error: ApplicationError) => void): void {
    this.errorListeners.push(listener);
  }

  // Remove error listener
  public removeErrorListener(
    listener: (error: ApplicationError) => void
  ): void {
    this.errorListeners = this.errorListeners.filter((l) => l !== listener);
  }

  // Handle any error
  public handle(
    error: unknown,
    context?: Record<string, any>
  ): ApplicationError {
    let appError: ApplicationError;

    if (error instanceof AppError) {
      appError = error.toJSON();
    } else if (error instanceof Error) {
      appError = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now(),
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      appError = {
        name: 'UnknownError',
        message:
          typeof error === 'string' ? error : 'An unknown error occurred',
        context,
        timestamp: Date.now(),
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    // Notify listeners
    this.errorListeners.forEach((listener) => {
      try {
        listener(appError);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Log error
    this.logError(appError);

    return appError;
  }

  private logError(error: ApplicationError): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.name}`);
      console.error('Message:', error.message);
      console.error('ID:', error.id);
      if (error.code) console.error('Code:', error.code);
      if (error.status) console.error('Status:', error.status);
      if (error.context) console.error('Context:', error.context);
      if (error.stack) console.error('Stack:', error.stack);
      console.groupEnd();
    }
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// API error handling utilities
export function handleApiError(response: Response): Promise<never> {
  const status = response.status;
  const statusText = response.statusText;

  return response.json().then(
    (errorData) => {
      const message =
        errorData.message || errorData.error || statusText || 'Request failed';

      switch (status) {
        case 400:
          throw new ValidationError(message);
        case 401:
          throw new AuthenticationError(message);
        case 403:
          throw new AuthorizationError(message);
        case 404:
          throw new NotFoundError(message);
        case 500:
        case 502:
        case 503:
        case 504:
          throw new AppError(
            message,
            ErrorType.SERVER,
            'SERVER_ERROR',
            status,
            { response: errorData }
          );
        default:
          throw new NetworkError(message, status, { response: errorData });
      }
    },
    () => {
      // If response.json() fails, fallback to status text
      const message = statusText || 'Request failed';

      switch (status) {
        case 400:
          throw new ValidationError(message);
        case 401:
          throw new AuthenticationError(message);
        case 403:
          throw new AuthorizationError(message);
        case 404:
          throw new NotFoundError(message);
        case 500:
        case 502:
        case 503:
        case 504:
          throw new AppError(message, ErrorType.SERVER, 'SERVER_ERROR', status);
        default:
          throw new NetworkError(message, status);
      }
    }
  );
}

// Async error wrapper
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = errorHandler.handle(error, { function: fn.name, args });
      throw new AppError(
        appError.message,
        ErrorType.UNKNOWN,
        appError.code,
        appError.status,
        appError.context
      );
    }
  };
}

// React hook for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<ApplicationError | null>(null);

  const handleError = React.useCallback(
    (error: unknown, context?: Record<string, any>) => {
      const appError = errorHandler.handle(error, context);
      setError(appError);
    },
    []
  );

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retryWithErrorHandling = React.useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        clearError();
        return await fn();
      } catch (error) {
        handleError(error);
        return null;
      }
    },
    [handleError, clearError]
  );

  return {
    error,
    handleError,
    clearError,
    retryWithErrorHandling,
  };
}

// Form validation error handling
export function handleFormErrors(
  errors: Record<string, any>
): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  for (const [field, error] of Object.entries(errors)) {
    if (error) {
      if (typeof error === 'string') {
        formattedErrors[field] = error;
      } else if (error.message) {
        formattedErrors[field] = error.message;
      } else if (Array.isArray(error) && error.length > 0) {
        formattedErrors[field] = error[0];
      } else {
        formattedErrors[field] = 'Invalid value';
      }
    }
  }

  return formattedErrors;
}

// Network retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffFactor: number = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = initialDelay * Math.pow(backoffFactor, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Error reporting service
export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private reportingEndpoint?: string;

  private constructor() {
    this.reportingEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  public async reportError(
    error: ApplicationError,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const report = {
      ...error,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      additionalContext,
    };

    // Send to external service
    if (this.reportingEndpoint) {
      try {
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }

    // Send to Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'exception', {
        description: `${error.name}: ${error.message}`,
        fatal: false,
        error_id: error.id,
      });
    }
  }
}

// Global error reporting instance
export const errorReporting = ErrorReportingService.getInstance();

// Setup global error handlers
if (typeof window !== 'undefined') {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = errorHandler.handle(event.reason, {
      type: 'unhandledrejection',
    });
    errorReporting.reportError(error);
  });

  // Global errors
  window.addEventListener('error', (event) => {
    const error = errorHandler.handle(event.error, {
      type: 'global',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    errorReporting.reportError(error);
  });
}
