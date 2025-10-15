// Validation utilities using Zod

import { z } from 'zod';
import {
  VALIDATION,
  USER_ROLES,
  GENDER_OPTIONS,
  EVENT_TYPES,
} from '../constants';

// Common validation schemas
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(
    VALIDATION.PASSWORD_MIN_LENGTH,
    `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
  )
  .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/(?=.*\d)/, 'Password must contain at least one number');

export const usernameSchema = z
  .string()
  .min(
    VALIDATION.USERNAME_MIN_LENGTH,
    `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`
  )
  .max(
    VALIDATION.USERNAME_MAX_LENGTH,
    `Username must be at most ${VALIDATION.USERNAME_MAX_LENGTH} characters`
  )
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  );

// User validation schemas
export const userRegisterSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .optional(),
  username: usernameSchema.optional(),
  bio: z
    .string()
    .max(
      VALIDATION.BIO_MAX_LENGTH,
      `Bio must be at most ${VALIDATION.BIO_MAX_LENGTH} characters`
    )
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  gender: z
    .enum([GENDER_OPTIONS.MALE, GENDER_OPTIONS.FEMALE, GENDER_OPTIONS.OTHER])
    .optional(),
  socials: z
    .object({
      linkedin: z.string().url('Invalid LinkedIn URL').optional(),
      github: z.string().url('Invalid GitHub URL').optional(),
      behance: z.string().url('Invalid Behance URL').optional(),
    })
    .optional(),
});

// Event validation schemas
export const eventBaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(VALIDATION.EVENT_TITLE_MAX_LENGTH, 'Title is too long'),
  description: z.string().min(1, 'Description is required'),
  Type: z.enum([
    EVENT_TYPES.WORKSHOPS,
    EVENT_TYPES.TALKS,
    EVENT_TYPES.WORKSHOPS_TALKS,
    EVENT_TYPES.MEETUPS,
    EVENT_TYPES.NETWORKING,
    EVENT_TYPES.FUN,
    EVENT_TYPES.TECH,
    EVENT_TYPES.OTHER,
  ]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  location: z.string().min(1, 'Location is required'),
  image: z.string().url('Invalid image URL').optional(),
  organizerClub: objectIdSchema.optional(),
  maxParticipants: z
    .number()
    .min(1, 'Max participants must be at least 1')
    .optional(),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const createEventSchema = eventBaseSchema.refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const updateEventSchema = eventBaseSchema.partial();

// Club validation schemas
export const createClubSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(VALIDATION.CLUB_NAME_MAX_LENGTH, 'Name is too long'),
  description: z.string().min(1, 'Description is required'),
  about: z.string().optional(),
  image: z.string().url('Invalid image URL').optional(),
  banner: z.string().url('Invalid banner URL').optional(),
  domains: z.array(z.string()).default([]),
  socialMedia: z
    .object({
      website: z.string().url('Invalid website URL').optional(),
      instagram: z.string().url('Invalid Instagram URL').optional(),
      linkedin: z.string().url('Invalid LinkedIn URL').optional(),
      twitter: z.string().url('Invalid Twitter URL').optional(),
      github: z.string().url('Invalid GitHub URL').optional(),
      discord: z.string().url('Invalid Discord URL').optional(),
    })
    .optional(),
  establishedDate: z.coerce.date().optional(),
  contactEmail: emailSchema.optional(),
});

export const updateClubSchema = createClubSchema.partial();

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Search validation schema
export const searchSchema = paginationSchema.extend({
  q: z.string().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().min(1, 'Mimetype is required'),
  size: z.number().max(5 * 1024 * 1024, 'File size cannot exceed 5MB'),
});

// Utility function to validate data against a schema
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    throw error;
  }
}
