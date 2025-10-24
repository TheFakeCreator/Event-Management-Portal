import { z } from 'zod';

// Event form schema
export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  longDescription: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 hour')
    .max(24, 'Duration cannot exceed 24 hours'),
  location: z.string().min(1, 'Location is required'),
  isPublic: z.boolean(),
  requiresApproval: z.boolean(),
  maxParticipants: z
    .number()
    .min(1, 'Must allow at least 1 participant')
    .optional(),
  registrationDeadline: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  agenda: z
    .array(
      z.object({
        time: z.string(),
        item: z.string(),
      })
    )
    .optional(),
  contact: z
    .object({
      email: z.string().email('Invalid email').optional(),
      phone: z.string().optional(),
      website: z.string().url('Invalid website URL').optional(),
    })
    .optional(),
  cost: z
    .object({
      amount: z.number().min(0, 'Cost cannot be negative').optional(),
      currency: z.string(),
      description: z.string().optional(),
    })
    .optional(),
});

export type CreateEventData = z.infer<typeof createEventSchema>;

// Club form schema
export const createClubSchema = z.object({
  name: z
    .string()
    .min(1, 'Club name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  contact: z
    .object({
      email: z.string().email('Invalid email').optional(),
      phone: z.string().optional(),
      website: z.string().url('Invalid website URL').optional(),
      social: z
        .object({
          facebook: z.string().url('Invalid Facebook URL').optional(),
          twitter: z.string().url('Invalid Twitter URL').optional(),
          instagram: z.string().url('Invalid Instagram URL').optional(),
          linkedin: z.string().url('Invalid LinkedIn URL').optional(),
          discord: z.string().optional(),
          telegram: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  membershipInfo: z
    .object({
      isOpen: z.boolean().default(true),
      requiresApproval: z.boolean().default(false),
      membershipFee: z.number().min(0, 'Fee cannot be negative').optional(),
      benefits: z.array(z.string()).optional(),
    })
    .optional(),
  meetingInfo: z
    .object({
      frequency: z.string().optional(),
      location: z.string().optional(),
      time: z.string().optional(),
    })
    .optional(),
});

export type CreateClubData = z.infer<typeof createClubSchema>;

// User registration/profile schema
export const userProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  year: z.string().optional(),
  major: z.string().optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      website: z.string().url('Invalid website URL').optional(),
      social: z
        .object({
          github: z.string().url('Invalid GitHub URL').optional(),
          linkedin: z.string().url('Invalid LinkedIn URL').optional(),
          twitter: z.string().url('Invalid Twitter URL').optional(),
          portfolio: z.string().url('Invalid portfolio URL').optional(),
        })
        .optional(),
    })
    .optional(),
  preferences: z
    .object({
      emailNotifications: z.boolean().default(true),
      eventReminders: z.boolean().default(true),
      clubUpdates: z.boolean().default(true),
      marketingEmails: z.boolean().default(false),
    })
    .optional(),
});

export type UserProfileData = z.infer<typeof userProfileSchema>;

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Common field options
export const EVENT_CATEGORIES = [
  'Technology',
  'Business',
  'Arts',
  'Sports',
  'Academic',
  'Social',
  'Volunteer',
  'Cultural',
  'Health',
  'Environment',
  'Other',
] as const;

export const CLUB_CATEGORIES = [
  'Academic',
  'Technology',
  'Business',
  'Arts & Culture',
  'Sports & Recreation',
  'Community Service',
  'Professional',
  'Special Interest',
  'Religious',
  'Political',
  'Other',
] as const;

export const STUDENT_YEARS = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate',
  'PhD',
  'Alumni',
  'Faculty',
  'Staff',
] as const;
