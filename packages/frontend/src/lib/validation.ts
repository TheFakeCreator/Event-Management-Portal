import { z } from 'zod';

// Common validation schemas
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number');

const urlSchema = z.string().url('Please enter a valid URL').or(z.literal(''));

const requiredStringSchema = z.string().min(1, 'This field is required').trim();

const optionalStringSchema = z.string().optional().or(z.literal(''));

// User Authentication Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: requiredStringSchema.min(
      2,
      'First name must be at least 2 characters'
    ),
    lastName: requiredStringSchema.min(
      2,
      'Last name must be at least 2 characters'
    ),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phoneNumber: phoneSchema,
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Profile Schemas
export const profileSchema = z.object({
  firstName: requiredStringSchema.min(
    2,
    'First name must be at least 2 characters'
  ),
  lastName: requiredStringSchema.min(
    2,
    'Last name must be at least 2 characters'
  ),
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: urlSchema.optional(),
  location: optionalStringSchema,
  socialLinks: z
    .object({
      twitter: urlSchema.optional(),
      linkedin: urlSchema.optional(),
      github: urlSchema.optional(),
    })
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });

// Event Schemas
export const eventSchema = z.object({
  title: requiredStringSchema
    .min(5, 'Event title must be at least 5 characters')
    .max(100, 'Event title must be less than 100 characters'),
  description: requiredStringSchema
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  category: requiredStringSchema,
  location: z.object({
    venue: requiredStringSchema,
    address: requiredStringSchema,
    city: requiredStringSchema,
    state: optionalStringSchema,
    country: requiredStringSchema,
    zipCode: optionalStringSchema,
  }),
  dateTime: z.object({
    startDate: z.date({ required_error: 'Start date is required' }),
    endDate: z.date({ required_error: 'End date is required' }),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
  }),
  pricing: z.object({
    type: z.enum(['free', 'paid'], {
      required_error: 'Please select pricing type',
    }),
    amount: z.number().min(0, 'Price cannot be negative').optional(),
    currency: z.string().default('USD'),
  }),
  capacity: z.object({
    maxAttendees: z
      .number()
      .int('Maximum attendees must be a whole number')
      .min(1, 'Must allow at least 1 attendee')
      .max(10000, 'Maximum capacity is 10,000 attendees'),
    allowWaitlist: z.boolean().default(false),
  }),
  registration: z.object({
    isOpen: z.boolean().default(true),
    deadline: z.date().optional(),
    requireApproval: z.boolean().default(false),
  }),
  visibility: z.enum(['public', 'private', 'unlisted'], {
    required_error: 'Please select event visibility',
  }),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
});

// Club Schemas
export const clubSchema = z.object({
  name: requiredStringSchema
    .min(3, 'Club name must be at least 3 characters')
    .max(50, 'Club name must be less than 50 characters'),
  description: requiredStringSchema
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  category: requiredStringSchema,
  mission: z
    .string()
    .max(300, 'Mission statement must be less than 300 characters')
    .optional()
    .or(z.literal('')),
  established: z
    .date()
    .max(new Date(), 'Establishment date cannot be in the future')
    .optional(),
  location: optionalStringSchema,
  website: urlSchema.optional(),
  socialLinks: z
    .object({
      facebook: urlSchema.optional(),
      instagram: urlSchema.optional(),
      twitter: urlSchema.optional(),
      linkedin: urlSchema.optional(),
    })
    .optional(),
  contactInfo: z.object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
  }),
  membershipInfo: z.object({
    isOpen: z.boolean().default(true),
    requireApplication: z.boolean().default(false),
    membershipFee: z
      .number()
      .min(0, 'Membership fee cannot be negative')
      .optional(),
  }),
  tags: z.array(z.string()).optional(),
  logo: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
});

// Recruitment Schemas
export const recruitmentSchema = z.object({
  title: requiredStringSchema
    .min(5, 'Title must be at least 5 characters')
    .max(80, 'Title must be less than 80 characters'),
  description: requiredStringSchema
    .min(50, 'Description must be at least 50 characters')
    .max(1500, 'Description must be less than 1500 characters'),
  positions: z
    .array(
      z.object({
        title: requiredStringSchema,
        description: requiredStringSchema,
        requirements: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        timeCommitment: optionalStringSchema,
      })
    )
    .min(1, 'At least one position is required'),
  applicationDeadline: z.date({
    required_error: 'Application deadline is required',
  }),
  contactEmail: emailSchema,
  applicationProcess: z.object({
    steps: z.array(z.string()),
    requirements: z.array(z.string()).optional(),
    interviewRequired: z.boolean().default(false),
  }),
  eligibility: z.object({
    gpaRequirement: z
      .number()
      .min(0, 'GPA cannot be negative')
      .max(4, 'GPA cannot exceed 4.0')
      .optional(),
    yearRequirements: z.array(z.string()).optional(),
    experienceRequired: z.boolean().default(false),
  }),
  benefits: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// Announcement Schemas
export const announcementSchema = z.object({
  title: requiredStringSchema
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  content: requiredStringSchema
    .min(10, 'Content must be at least 10 characters')
    .max(1000, 'Content must be less than 1000 characters'),
  type: z.enum(['general', 'event', 'urgent', 'reminder'], {
    required_error: 'Please select announcement type',
  }),
  targetAudience: z.enum(['all', 'members', 'officers', 'specific'], {
    required_error: 'Please select target audience',
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select priority level',
  }),
  expirationDate: z.date().optional(),
  attachments: z.array(z.string().url()).optional(),
  isPinned: z.boolean().default(false),
  sendNotification: z.boolean().default(true),
});

// Contact/Support Schemas
export const contactSchema = z.object({
  name: requiredStringSchema.min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  subject: requiredStringSchema
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  message: requiredStringSchema
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  category: z
    .enum([
      'general',
      'technical',
      'billing',
      'feedback',
      'bug-report',
      'feature-request',
    ])
    .optional(),
});

// Search and Filter Schemas
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query must be less than 100 characters'),
  category: optionalStringSchema,
  location: optionalStringSchema,
  dateRange: z
    .object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    })
    .optional(),
  priceRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  sortBy: z.enum(['date', 'title', 'popularity', 'price']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type ClubFormData = z.infer<typeof clubSchema>;
export type RecruitmentFormData = z.infer<typeof recruitmentSchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;

// Utility functions for form validation
export const createFormValidator = <T extends z.ZodSchema>(schema: T) => {
  return {
    validate: (data: unknown) => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data, errors: null };
      } else {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          errors[path] = issue.message;
        });
        return { success: false, data: null, errors };
      }
    },
    validateAsync: async (data: unknown) => {
      try {
        const validatedData = await schema.parseAsync(data);
        return { success: true, data: validatedData, errors: null };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors: Record<string, string> = {};
          error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            errors[path] = issue.message;
          });
          return { success: false, data: null, errors };
        }
        throw error;
      }
    },
  };
};

// Pre-configured validators
export const validators = {
  login: createFormValidator(loginSchema),
  register: createFormValidator(registerSchema),
  forgotPassword: createFormValidator(forgotPasswordSchema),
  resetPassword: createFormValidator(resetPasswordSchema),
  profile: createFormValidator(profileSchema),
  changePassword: createFormValidator(changePasswordSchema),
  event: createFormValidator(eventSchema),
  club: createFormValidator(clubSchema),
  recruitment: createFormValidator(recruitmentSchema),
  announcement: createFormValidator(announcementSchema),
  contact: createFormValidator(contactSchema),
  search: createFormValidator(searchSchema),
};
