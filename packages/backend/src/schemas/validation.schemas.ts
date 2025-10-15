// Zod Validation Schemas
// Comprehensive validation schemas for all API endpoints

import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Common validation helpers
 */
export const zodHelpers = {
  // MongoDB ObjectId validation
  objectId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  }),

  // Email validation with proper regex
  email: z.string().email('Invalid email format'),

  // Password validation that matches our security requirements
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain at least one special character'
    ),

  // URL validation
  url: z.string().url('Invalid URL format'),

  // Date validation
  dateString: z.string().datetime('Invalid date format'),

  // Pagination helpers
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be greater than 0'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
};

/**
 * Authentication schemas
 */
export const authSchemas = {
  register: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),

    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),

    email: zodHelpers.email,
    password: zodHelpers.password,
  }),

  login: z.object({
    email: zodHelpers.email,
    password: z.string().min(1, 'Password is required'),
  }),

  forgotPassword: z.object({
    email: zodHelpers.email,
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: zodHelpers.password,
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: zodHelpers.password,
  }),

  verifyEmail: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
};

/**
 * User schemas
 */
export const userSchemas = {
  updateProfile: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
      .optional(),

    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
      .optional(),

    bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  }),

  getUserParams: z.object({
    userId: zodHelpers.objectId,
  }),

  getUsersQuery: z.object({
    page: zodHelpers.page,
    limit: zodHelpers.limit,
    search: z.string().optional(),
    role: z.enum(['user', 'admin', 'moderator']).optional(),
  }),
};

/**
 * Event schemas
 */
export const eventSchemas = {
  create: z
    .object({
      title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must not exceed 100 characters'),

      description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must not exceed 1000 characters'),

      startDate: zodHelpers.dateString,
      endDate: zodHelpers.dateString,

      location: z
        .string()
        .min(3, 'Location must be at least 3 characters')
        .max(200, 'Location must not exceed 200 characters'),

      maxParticipants: z
        .number()
        .min(1, 'Maximum participants must be at least 1')
        .max(10000, 'Maximum participants cannot exceed 10,000'),

      clubId: zodHelpers.objectId,

      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().default(true),
    })
    .refine(
      (data) => {
        return new Date(data.endDate) > new Date(data.startDate);
      },
      {
        message: 'End date must be after start date',
        path: ['endDate'],
      }
    ),

  update: z
    .object({
      title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must not exceed 100 characters')
        .optional(),

      description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),

      startDate: zodHelpers.dateString.optional(),
      endDate: zodHelpers.dateString.optional(),

      location: z
        .string()
        .min(3, 'Location must be at least 3 characters')
        .max(200, 'Location must not exceed 200 characters')
        .optional(),

      maxParticipants: z
        .number()
        .min(1, 'Maximum participants must be at least 1')
        .max(10000, 'Maximum participants cannot exceed 10,000')
        .optional(),

      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.endDate) > new Date(data.startDate);
        }
        return true;
      },
      {
        message: 'End date must be after start date',
        path: ['endDate'],
      }
    ),

  getEventParams: z.object({
    eventId: zodHelpers.objectId,
  }),

  getEventsQuery: z.object({
    page: zodHelpers.page,
    limit: zodHelpers.limit,
    search: z.string().optional(),
    clubId: zodHelpers.objectId.optional(),
    status: z
      .enum(['upcoming', 'ongoing', 'completed', 'cancelled'])
      .optional(),
    startDate: zodHelpers.dateString.optional(),
    endDate: zodHelpers.dateString.optional(),
  }),

  register: z.object({
    eventId: zodHelpers.objectId,
  }),
};

/**
 * Club schemas
 */
export const clubSchemas = {
  create: z.object({
    name: z
      .string()
      .min(3, 'Club name must be at least 3 characters')
      .max(100, 'Club name must not exceed 100 characters'),

    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must not exceed 1000 characters'),

    contactEmail: zodHelpers.email,

    socialLinks: z
      .object({
        website: zodHelpers.url.optional(),
        facebook: zodHelpers.url.optional(),
        twitter: zodHelpers.url.optional(),
        instagram: zodHelpers.url.optional(),
        linkedin: zodHelpers.url.optional(),
      })
      .optional(),

    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().default(true),
  }),

  update: z.object({
    name: z
      .string()
      .min(3, 'Club name must be at least 3 characters')
      .max(100, 'Club name must not exceed 100 characters')
      .optional(),

    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),

    contactEmail: zodHelpers.email.optional(),

    socialLinks: z
      .object({
        website: zodHelpers.url.optional(),
        facebook: zodHelpers.url.optional(),
        twitter: zodHelpers.url.optional(),
        instagram: zodHelpers.url.optional(),
        linkedin: zodHelpers.url.optional(),
      })
      .optional(),

    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
  }),

  getClubParams: z.object({
    clubId: zodHelpers.objectId,
  }),

  getClubsQuery: z.object({
    page: zodHelpers.page,
    limit: zodHelpers.limit,
    search: z.string().optional(),
    tags: z.string().optional(), // Comma-separated tags
  }),

  joinClub: z.object({
    clubId: zodHelpers.objectId,
  }),
};

/**
 * Announcement schemas
 */
export const announcementSchemas = {
  create: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must not exceed 100 characters'),

    content: z
      .string()
      .min(10, 'Content must be at least 10 characters')
      .max(1000, 'Content must not exceed 1000 characters'),

    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    isGlobal: z.boolean().default(false),
    clubId: zodHelpers.objectId.optional(),
  }),

  update: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must not exceed 100 characters')
      .optional(),

    content: z
      .string()
      .min(10, 'Content must be at least 10 characters')
      .max(1000, 'Content must not exceed 1000 characters')
      .optional(),

    priority: z.enum(['low', 'medium', 'high']).optional(),
    isGlobal: z.boolean().optional(),
  }),

  getAnnouncementParams: z.object({
    announcementId: zodHelpers.objectId,
  }),

  getAnnouncementsQuery: z.object({
    page: zodHelpers.page,
    limit: zodHelpers.limit,
    priority: z.enum(['low', 'medium', 'high']).optional(),
    clubId: zodHelpers.objectId.optional(),
    isGlobal: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
};

/**
 * Recruitment schemas
 */
export const recruitmentSchemas = {
  create: z
    .object({
      title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must not exceed 100 characters'),

      description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must not exceed 1000 characters'),

      requirements: z
        .array(z.string())
        .min(1, 'At least one requirement is needed'),

      positions: z
        .number()
        .min(1, 'At least 1 position is required')
        .max(100, 'Cannot have more than 100 positions'),

      deadline: zodHelpers.dateString,
      clubId: zodHelpers.objectId,

      contactEmail: zodHelpers.email.optional(),
      isActive: z.boolean().default(true),
    })
    .refine(
      (data) => {
        return new Date(data.deadline) > new Date();
      },
      {
        message: 'Deadline must be in the future',
        path: ['deadline'],
      }
    ),

  update: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must not exceed 100 characters')
      .optional(),

    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),

    requirements: z
      .array(z.string())
      .min(1, 'At least one requirement is needed')
      .optional(),

    positions: z
      .number()
      .min(1, 'At least 1 position is required')
      .max(100, 'Cannot have more than 100 positions')
      .optional(),

    deadline: zodHelpers.dateString.optional(),
    contactEmail: zodHelpers.email.optional(),
    isActive: z.boolean().optional(),
  }),

  apply: z.object({
    recruitmentId: zodHelpers.objectId,
    coverLetter: z
      .string()
      .min(50, 'Cover letter must be at least 50 characters')
      .max(2000, 'Cover letter must not exceed 2000 characters'),
  }),

  getRecruitmentParams: z.object({
    recruitmentId: zodHelpers.objectId,
  }),

  getRecruitmentsQuery: z.object({
    page: zodHelpers.page,
    limit: zodHelpers.limit,
    clubId: zodHelpers.objectId.optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
};

/**
 * Admin schemas
 */
export const adminSchemas = {
  updateUserRole: z.object({
    userId: zodHelpers.objectId,
    role: z.enum(['user', 'admin', 'moderator']),
  }),

  banUser: z.object({
    userId: zodHelpers.objectId,
    reason: z
      .string()
      .min(10, 'Ban reason must be at least 10 characters')
      .max(500, 'Ban reason must not exceed 500 characters'),
    duration: z
      .number()
      .min(1, 'Ban duration must be at least 1 day')
      .optional(),
  }),

  systemSettings: z.object({
    maintenanceMode: z.boolean().optional(),
    registrationEnabled: z.boolean().optional(),
    maxEventsPerUser: z.number().min(1).max(100).optional(),
    maxClubsPerUser: z.number().min(1).max(10).optional(),
  }),
};

/**
 * File upload schemas
 */
export const uploadSchemas = {
  profilePicture: z.object({
    file: z.any(), // Will be validated by multer middleware
  }),

  eventImage: z.object({
    eventId: zodHelpers.objectId,
    file: z.any(),
  }),

  clubLogo: z.object({
    clubId: zodHelpers.objectId,
    file: z.any(),
  }),
};

/**
 * Export all schemas for easy import
 */
export const schemas = {
  auth: authSchemas,
  user: userSchemas,
  event: eventSchemas,
  club: clubSchemas,
  announcement: announcementSchemas,
  recruitment: recruitmentSchemas,
  admin: adminSchemas,
  upload: uploadSchemas,
};

// Type inference helpers
export type AuthRegisterInput = z.infer<typeof authSchemas.register>;
export type AuthLoginInput = z.infer<typeof authSchemas.login>;
export type EventCreateInput = z.infer<typeof eventSchemas.create>;
export type EventUpdateInput = z.infer<typeof eventSchemas.update>;
export type ClubCreateInput = z.infer<typeof clubSchemas.create>;
export type ClubUpdateInput = z.infer<typeof clubSchemas.update>;
export type UserUpdateProfileInput = z.infer<typeof userSchemas.updateProfile>;
