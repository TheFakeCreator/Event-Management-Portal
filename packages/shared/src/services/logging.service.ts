import winston from 'winston';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import DailyRotateFile from 'winston-daily-rotate-file';

interface LogContext {
  correlationId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

interface LogMetadata {
  service: string;
  version: string;
  environment: string;
  hostname: string;
  pid: number;
  timestamp: string;
  level: string;
  context?: LogContext;
}

class LoggingService {
  private logger: winston.Logger;
  private auditLogger: winston.Logger;
  private performanceLogger: winston.Logger;
  private securityLogger: winston.Logger;

  constructor() {
    this.logger = this.createMainLogger();
    this.auditLogger = this.createAuditLogger();
    this.performanceLogger = this.createPerformanceLogger();
    this.securityLogger = this.createSecurityLogger();
  }

  private createMainLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        return JSON.stringify({
          timestamp,
          level,
          message,
          service: 'event-management-portal',
          environment: process.env.NODE_ENV || 'development',
          hostname: process.env.HOSTNAME || 'localhost',
          pid: process.pid,
          ...meta,
        });
      })
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((info) => {
        const { timestamp, level, message, correlationId, ...meta } = info;
        const correlation = correlationId ? `[${correlationId}]` : '';
        const metaStr = Object.keys(meta).length
          ? JSON.stringify(meta, null, 2)
          : '';
        return `${timestamp} ${level} ${correlation} ${message} ${metaStr}`;
      })
    );

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: {
        service: 'event-management-portal',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format:
            process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),

        // File transport for all logs
        new DailyRotateFile({
          filename: path.join('logs', 'app-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          maxSize: '20m',
          format: logFormat,
          level: 'info',
        }),

        // Error file transport
        new DailyRotateFile({
          filename: path.join('logs', 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          maxSize: '20m',
          format: logFormat,
          level: 'error',
        }),
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join('logs', 'exceptions.log'),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join('logs', 'rejections.log'),
        }),
      ],
    });
  }

  private createAuditLogger(): winston.Logger {
    return winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new DailyRotateFile({
          filename: path.join('logs', 'audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '90d', // Keep audit logs longer
          maxSize: '50m',
          level: 'info',
        }),
      ],
    });
  }

  private createPerformanceLogger(): winston.Logger {
    return winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new DailyRotateFile({
          filename: path.join('logs', 'performance-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          maxSize: '100m',
          level: 'info',
        }),
      ],
    });
  }

  private createSecurityLogger(): winston.Logger {
    return winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new DailyRotateFile({
          filename: path.join('logs', 'security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '90d', // Keep security logs longer
          maxSize: '20m',
          level: 'info',
        }),
        // Also log security events to console in development
        ...(process.env.NODE_ENV === 'development'
          ? [new winston.transports.Console()]
          : []),
      ],
    });
  }

  // Main logging methods
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, {
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      ...context,
    });
  }

  // Audit logging
  audit(action: string, details: any, context?: LogContext): void {
    this.auditLogger.info('AUDIT_EVENT', {
      action,
      details: this.sanitizeData(details),
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.performanceLogger.info('PERFORMANCE_METRIC', {
      operation,
      duration,
      ...context,
      timestamp: new Date().toISOString(),
    });

    // Log slow operations as warnings
    if (duration > 5000) {
      this.warn(
        `Slow operation detected: ${operation} took ${duration}ms`,
        context
      );
    }
  }

  // Security logging
  security(event: string, details: any, context?: LogContext): void {
    this.securityLogger.info('SECURITY_EVENT', {
      event,
      details: this.sanitizeData(details),
      ...context,
      timestamp: new Date().toISOString(),
    });

    // Also log to main logger for visibility
    this.warn(`Security event: ${event}`, context);
  }

  // Request logging
  logRequest(req: Request, res: Response, duration: number): void {
    const context: LogContext = {
      correlationId: req.headers['x-correlation-id'] as string,
      userId: (req as any).user?.id,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: duration,
    };

    if (res.statusCode >= 400) {
      this.warn(
        `HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`,
        context
      );
    } else {
      this.info(
        `HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`,
        context
      );
    }

    // Log performance metrics
    this.performance(
      `HTTP_REQUEST ${req.method} ${req.route?.path || req.originalUrl}`,
      duration,
      context
    );
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    collection: string,
    duration: number,
    context?: LogContext
  ): void {
    this.performance(
      `DB_${operation.toUpperCase()}_${collection.toUpperCase()}`,
      duration,
      context
    );

    if (duration > 1000) {
      this.warn(
        `Slow database query: ${operation} on ${collection} took ${duration}ms`,
        context
      );
    }
  }

  // Authentication logging
  logAuth(
    event: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'TOKEN_REFRESH',
    userId?: string,
    context?: LogContext
  ): void {
    this.audit(`AUTH_${event}`, { userId }, context);

    if (event === 'LOGIN_FAILED') {
      this.security('AUTHENTICATION_FAILURE', { userId }, context);
    }
  }

  // Authorization logging
  logAuthorization(
    event: 'ACCESS_GRANTED' | 'ACCESS_DENIED',
    resource: string,
    action: string,
    userId?: string,
    context?: LogContext
  ): void {
    this.audit(`AUTHZ_${event}`, { resource, action, userId }, context);

    if (event === 'ACCESS_DENIED') {
      this.security(
        'AUTHORIZATION_FAILURE',
        { resource, action, userId },
        context
      );
    }
  }

  // Data modification logging
  logDataChange(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    resourceType: string,
    resourceId: string,
    changes: any,
    userId?: string,
    context?: LogContext
  ): void {
    this.audit(
      `DATA_${operation}`,
      {
        resourceType,
        resourceId,
        changes: this.sanitizeData(changes),
        userId,
      },
      context
    );
  }

  // Error reporting
  reportError(error: Error, context?: LogContext): void {
    this.error(error.message, error, context);

    // Log critical errors to security logger as well
    if (this.isCriticalError(error)) {
      this.security(
        'CRITICAL_ERROR',
        {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context
      );
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalErrors = [
      'DatabaseConnectionError',
      'SecurityError',
      'AuthenticationError',
    ];
    return criticalErrors.some((type) => error.name.includes(type));
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = JSON.parse(JSON.stringify(data));
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
    ];

    const sanitizeObject = (obj: any): void => {
      if (typeof obj !== 'object' || obj === null) return;

      Object.keys(obj).forEach((key) => {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  // Correlation ID middleware
  correlationMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const correlationId =
        (req.headers['x-correlation-id'] as string) || uuidv4();
      req.headers['x-correlation-id'] = correlationId;
      res.setHeader('X-Correlation-ID', correlationId);
      next();
    };
  }

  // Request logging middleware
  requestMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logRequest(req, res, duration);
      });

      next();
    };
  }

  // Health check
  getHealth(): { status: string; loggers: string[] } {
    return {
      status: 'healthy',
      loggers: ['main', 'audit', 'performance', 'security'],
    };
  }
}

// Create singleton instance
export const loggingService = new LoggingService();

// Export types
export type { LogContext, LogMetadata };

// Export convenience functions
export const logger = {
  debug: (message: string, context?: LogContext) =>
    loggingService.debug(message, context),
  info: (message: string, context?: LogContext) =>
    loggingService.info(message, context),
  warn: (message: string, context?: LogContext) =>
    loggingService.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) =>
    loggingService.error(message, error, context),
  audit: (action: string, details: any, context?: LogContext) =>
    loggingService.audit(action, details, context),
  performance: (operation: string, duration: number, context?: LogContext) =>
    loggingService.performance(operation, duration, context),
  security: (event: string, details: any, context?: LogContext) =>
    loggingService.security(event, details, context),
};
