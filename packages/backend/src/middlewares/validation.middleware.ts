// Validation Middleware
// Zod-based validation middleware for request validation

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema, ZodObject, ZodRawShape } from 'zod';
import { ApiResponse } from '@event-management/shared';

/**
 * Validation target types
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation options
 */
interface ValidationOptions {
  /**
   * Whether to strip unknown fields from the validated data
   */
  stripUnknown?: boolean;

  /**
   * Whether to allow partial validation (useful for PATCH requests)
   */
  partial?: boolean;
}

/**
 * Format Zod validation errors into a readable format
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    const field = path || 'root';

    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }

    formattedErrors[field].push(err.message);
  });

  return formattedErrors;
}

/**
 * Create validation middleware for a specific schema and target
 */
export function validate<T extends ZodRawShape>(
  schema: ZodObject<T> | ZodSchema<any>,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { stripUnknown = true, partial = false } = options;

      // Get the data to validate based on target
      let dataToValidate: any;
      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          throw new Error(`Invalid validation target: ${target}`);
      }

      // Apply partial validation if requested and schema is ZodObject
      let validationSchema: ZodSchema<any>;
      if (partial && schema instanceof ZodObject) {
        validationSchema = schema.partial();
      } else {
        validationSchema = schema;
      }

      // Validate the data (removed strict mode for compatibility)
      const validatedData = validationSchema.parse(dataToValidate);

      // Replace the original data with validated data
      switch (target) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: formatZodErrors(error),
        };
        res.status(400).json(response);
        return;
      }

      // Handle other errors
      console.error('Validation middleware error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal validation error',
        error: 'Something went wrong during validation',
      };
      res.status(500).json(response);
    }
  };
}

/**
 * Convenience functions for specific validation targets
 */
export const validateBody = (
  schema: ZodSchema<any>,
  options?: ValidationOptions
) => validate(schema, 'body', options);

export const validateQuery = (
  schema: ZodSchema<any>,
  options?: ValidationOptions
) => validate(schema, 'query', options);

export const validateParams = (
  schema: ZodSchema<any>,
  options?: ValidationOptions
) => validate(schema, 'params', options);

/**
 * Multiple validation middleware - validates multiple targets at once
 */
export function validateMultiple(
  validations: Array<{
    schema: ZodSchema<any>;
    target: ValidationTarget;
    options?: ValidationOptions;
  }>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const { schema, target, options = {} } of validations) {
        const { stripUnknown = true, partial = false } = options;

        // Get the data to validate
        let dataToValidate: any;
        switch (target) {
          case 'body':
            dataToValidate = req.body;
            break;
          case 'query':
            dataToValidate = req.query;
            break;
          case 'params':
            dataToValidate = req.params;
            break;
          default:
            throw new Error(`Invalid validation target: ${target}`);
        }

        // Apply validation options
        let validationSchema: ZodSchema<any>;
        if (partial && schema instanceof ZodObject) {
          validationSchema = schema.partial();
        } else {
          validationSchema = schema;
        }

        // Validate and update the request (removed strict mode for compatibility)
        const validatedData = validationSchema.parse(dataToValidate);

        switch (target) {
          case 'body':
            req.body = validatedData;
            break;
          case 'query':
            req.query = validatedData;
            break;
          case 'params':
            req.params = validatedData;
            break;
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: formatZodErrors(error),
        };
        res.status(400).json(response);
        return;
      }

      // Handle other errors
      console.error('Multiple validation middleware error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal validation error',
        error: 'Something went wrong during validation',
      };
      res.status(500).json(response);
    }
  };
}

/**
 * Custom validation middleware for file uploads
 */
export function validateFileUpload(
  allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  required: boolean = true
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const file = req.file;

      // Check if file is required
      if (required && !file) {
        const response: ApiResponse = {
          success: false,
          message: 'File upload failed',
          errors: { file: ['File is required'] },
        };
        res.status(400).json(response);
        return;
      }

      // If file is optional and not provided, continue
      if (!required && !file) {
        next();
        return;
      }

      // Validate file type
      if (!allowedTypes.includes(file!.mimetype)) {
        const response: ApiResponse = {
          success: false,
          message: 'File validation failed',
          errors: {
            file: [
              `File type ${file!.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
            ],
          },
        };
        res.status(400).json(response);
        return;
      }

      // Validate file size
      if (file!.size > maxSize) {
        const response: ApiResponse = {
          success: false,
          message: 'File validation failed',
          errors: {
            file: [
              `File size ${(file!.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
            ],
          },
        };
        res.status(400).json(response);
        return;
      }

      next();
    } catch (error) {
      console.error('File validation middleware error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'File validation error',
        error: 'Something went wrong during file validation',
      };
      res.status(500).json(response);
    }
  };
}

/**
 * Validation error response helper
 */
export function createValidationErrorResponse(
  message: string = 'Validation failed',
  errors: Record<string, string[]> = {}
): ApiResponse {
  return {
    success: false,
    message,
    errors,
  };
}

/**
 * Async validation wrapper for custom validation logic
 */
export function validateAsync(validator: (req: Request) => Promise<void>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await validator(req);
      next();
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          error: error.message,
        };
        res.status(400).json(response);
        return;
      }

      console.error('Async validation error:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal validation error',
        error: 'Something went wrong during validation',
      };
      res.status(500).json(response);
    }
  };
}

/**
 * Export commonly used validation middleware combinations
 */
export const commonValidations = {
  // Pagination validation
  pagination: validateQuery(
    z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, 'Page must be greater than 0'),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine(
          (val) => val > 0 && val <= 100,
          'Limit must be between 1 and 100'
        ),
    })
  ),

  // MongoDB ObjectId parameter validation
  objectIdParam: (paramName: string = 'id') =>
    validateParams(
      z.object({
        [paramName]: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
          message: 'Invalid ObjectId format',
        }),
      })
    ),

  // Search query validation
  search: validateQuery(
    z.object({
      search: z.string().optional(),
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10)),
    })
  ),
};
