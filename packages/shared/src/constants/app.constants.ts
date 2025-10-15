// Application-wide constants

// User Constants
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MEMBER: 'member',
  MODERATOR: 'moderator',
} as const;

export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

// Event Constants
export const EVENT_TYPES = {
  WORKSHOPS: 'Workshops',
  TALKS: 'Talks',
  WORKSHOPS_TALKS: 'Workshops & Talks',
  MEETUPS: 'Meetups',
  NETWORKING: 'Networking',
  FUN: 'Fun',
  TECH: 'Tech',
  OTHER: 'Other',
} as const;

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

// Validation Constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  BIO_MAX_LENGTH: 250,
  CLUB_NAME_MAX_LENGTH: 100,
  EVENT_TITLE_MAX_LENGTH: 200,
} as const;

// Time Constants
export const TIME = {
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  VERIFICATION_TOKEN_EXPIRES_IN: '1h',
  PASSWORD_RESET_EXPIRES_IN: '1h',
  ACCOUNT_LOCK_TIME: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password-reset',
  EVENT_REMINDER: 'event-reminder',
  EVENT_REGISTRATION: 'event-registration',
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  EVENTS: '/api/events',
  CLUBS: '/api/clubs',
  UPLOADS: '/api/uploads',
  ANNOUNCEMENTS: '/api/announcements',
  RECRUITMENTS: '/api/recruitments',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;
