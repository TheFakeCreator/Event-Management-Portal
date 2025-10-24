/**
 * Frontend application constants
 */

export const APP_CONFIG = {
  NAME: 'Event Management Portal',
  DESCRIPTION: 'Manage events, clubs, and community activities',
  VERSION: '2.0.0',
  AUTHOR: 'Event Management Team',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  DASHBOARD: '/dashboard',
  FEATURES: '/features',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // Events
  EVENTS: '/events',
  EVENT_DETAILS: (id: string) => `/events/${id}`,
  CREATE_EVENT: '/events/create',
  EDIT_EVENT: (id: string) => `/events/${id}/edit`,

  // Clubs
  CLUBS: '/clubs',
  CLUB_DETAILS: (id: string) => `/clubs/${id}`,
  CREATE_CLUB: '/clubs/create',
  EDIT_CLUB: (id: string) => `/clubs/${id}/edit`,

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_CLUBS: '/admin/clubs',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',

  // Misc
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: 'auth/login',
  REGISTER: 'auth/signup',
  LOGOUT: 'auth/logout',
  REFRESH: 'auth/refresh',
  PROFILE: 'auth/profile',

  // Users
  USERS: 'users',
  USER_BY_ID: (id: string) => `users/${id}`,

  // Events
  EVENTS: 'events',
  EVENT_BY_ID: (id: string) => `events/${id}`,
  EVENT_REGISTER: (id: string) => `events/${id}/register`,
  EVENT_UNREGISTER: (id: string) => `events/${id}/unregister`,

  // Clubs
  CLUBS: 'clubs',
  CLUB_BY_ID: (id: string) => `clubs/${id}`,
  CLUB_MEMBERS: (id: string) => `clubs/${id}/members`,
  CLUB_EVENTS: (id: string) => `clubs/${id}/events`,

  // Announcements
  ANNOUNCEMENTS: 'announcements',
  ANNOUNCEMENT_BY_ID: (id: string) => `announcements/${id}`,

  // Admin
  ADMIN_DASHBOARD: 'admin/dashboard',
  ADMIN_USERS: 'admin/users',
  ADMIN_EVENTS: 'admin/events',
  ADMIN_CLUBS: 'admin/clubs',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
} as const;

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 1000,
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  INPUT_WITH_TIME: 'yyyy-MM-dd HH:mm',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
} as const;

export const MESSAGES = {
  ERRORS: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION: 'Please check your input and try again.',
  },
  SUCCESS: {
    SAVED: 'Changes saved successfully.',
    DELETED: 'Item deleted successfully.',
    CREATED: 'Item created successfully.',
    UPDATED: 'Item updated successfully.',
  },
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  RESIZE: 100,
  SCROLL: 16,
} as const;
