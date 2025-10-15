// Common API response types and interfaces

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  q?: string;
  filters?: Record<string, any>;
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AppError {
  name: string;
  message: string;
  statusCode: number;
  isOperational: boolean;
  stack?: string;
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
}

// File upload types
export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  cloudinaryId?: string;
  uploadedAt: Date;
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}
