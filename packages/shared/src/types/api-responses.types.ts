// Comprehensive API Response Type Definitions
// Extends the existing common types with specific response interfaces

import {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
} from './common.types.js';
import { User } from './user.types.js';
import { Event } from './event.types.js';
import { Club } from './club.types.js';
import { Announcement } from './announcement.types.js';
import { Recruitment } from './recruitment.types.js';

/**
 * Authentication API Responses
 */
export interface LoginResponse
  extends ApiResponse<{
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {}

export interface RegisterResponse
  extends ApiResponse<{
    user: User;
    message: string;
    verificationRequired: boolean;
  }> {}

export interface RefreshTokenResponse
  extends ApiResponse<{
    accessToken: string;
    expiresIn: number;
  }> {}

export interface VerifyEmailResponse
  extends ApiResponse<{
    user: User;
    message: string;
  }> {}

export interface ForgotPasswordResponse
  extends ApiResponse<{
    message: string;
    resetTokenSent: boolean;
  }> {}

export interface ResetPasswordResponse
  extends ApiResponse<{
    message: string;
    loginRequired: boolean;
  }> {}

/**
 * User API Responses
 */
export interface UserProfileResponse extends ApiResponse<User> {}

export interface UsersListResponse extends PaginatedResponse<User> {}

export interface UpdateProfileResponse
  extends ApiResponse<{
    user: User;
    updatedFields: string[];
  }> {}

export interface ChangePasswordResponse
  extends ApiResponse<{
    message: string;
    logoutRequired: boolean;
  }> {}

export interface DeleteAccountResponse
  extends ApiResponse<{
    message: string;
    deletedAt: string;
  }> {}

/**
 * Event API Responses
 */
export interface EventResponse extends ApiResponse<Event> {}

export interface EventsListResponse extends PaginatedResponse<Event> {}

export interface CreateEventResponse
  extends ApiResponse<{
    event: Event;
    message: string;
    pendingApproval?: boolean;
  }> {}

export interface UpdateEventResponse
  extends ApiResponse<{
    event: Event;
    updatedFields: string[];
  }> {}

export interface DeleteEventResponse
  extends ApiResponse<{
    message: string;
    eventId: string;
    deletedAt: string;
  }> {}

export interface EventRegistrationResponse
  extends ApiResponse<{
    event: Event;
    registration: {
      id: string;
      registeredAt: string;
      status: 'registered' | 'waitlisted';
    };
    message: string;
  }> {}

export interface EventUnregistrationResponse
  extends ApiResponse<{
    eventId: string;
    message: string;
    unregisteredAt: string;
  }> {}

export interface EventParticipantsResponse extends PaginatedResponse<User> {}

/**
 * Club API Responses
 */
export interface ClubResponse extends ApiResponse<Club> {}

export interface ClubsListResponse extends PaginatedResponse<Club> {}

export interface CreateClubResponse
  extends ApiResponse<{
    club: Club;
    message: string;
    pendingApproval?: boolean;
  }> {}

export interface UpdateClubResponse
  extends ApiResponse<{
    club: Club;
    updatedFields: string[];
  }> {}

export interface DeleteClubResponse
  extends ApiResponse<{
    message: string;
    clubId: string;
    deletedAt: string;
  }> {}

export interface JoinClubResponse
  extends ApiResponse<{
    club: Club;
    membership: {
      id: string;
      joinedAt: string;
      role: 'member' | 'admin' | 'moderator';
    };
    message: string;
  }> {}

export interface LeaveClubResponse
  extends ApiResponse<{
    clubId: string;
    message: string;
    leftAt: string;
  }> {}

export interface ClubMembersResponse extends PaginatedResponse<User> {}

export interface ClubEventsResponse extends PaginatedResponse<Event> {}

/**
 * Announcement API Responses
 */
export interface AnnouncementResponse extends ApiResponse<Announcement> {}

export interface AnnouncementsListResponse
  extends PaginatedResponse<Announcement> {}

export interface CreateAnnouncementResponse
  extends ApiResponse<{
    announcement: Announcement;
    message: string;
  }> {}

export interface UpdateAnnouncementResponse
  extends ApiResponse<{
    announcement: Announcement;
    updatedFields: string[];
  }> {}

export interface DeleteAnnouncementResponse
  extends ApiResponse<{
    message: string;
    announcementId: string;
    deletedAt: string;
  }> {}

/**
 * Recruitment API Responses
 */
export interface RecruitmentResponse extends ApiResponse<Recruitment> {}

export interface RecruitmentsListResponse
  extends PaginatedResponse<Recruitment> {}

export interface CreateRecruitmentResponse
  extends ApiResponse<{
    recruitment: Recruitment;
    message: string;
  }> {}

export interface UpdateRecruitmentResponse
  extends ApiResponse<{
    recruitment: Recruitment;
    updatedFields: string[];
  }> {}

export interface DeleteRecruitmentResponse
  extends ApiResponse<{
    message: string;
    recruitmentId: string;
    deletedAt: string;
  }> {}

export interface ApplyRecruitmentResponse
  extends ApiResponse<{
    recruitment: Recruitment;
    application: {
      id: string;
      appliedAt: string;
      status: 'pending' | 'approved' | 'rejected';
    };
    message: string;
  }> {}

export interface RecruitmentApplicationsResponse
  extends PaginatedResponse<{
    id: string;
    user: User;
    coverLetter: string;
    appliedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }> {}

/**
 * Admin API Responses
 */
export interface AdminDashboardResponse
  extends ApiResponse<{
    stats: {
      totalUsers: number;
      totalEvents: number;
      totalClubs: number;
      totalRegistrations: number;
      recentActivity: Array<{
        type: string;
        description: string;
        timestamp: string;
      }>;
    };
    systemHealth: {
      database: 'healthy' | 'warning' | 'error';
      storage: 'healthy' | 'warning' | 'error';
      email: 'healthy' | 'warning' | 'error';
      overallStatus: 'healthy' | 'warning' | 'error';
    };
  }> {}

export interface UpdateUserRoleResponse
  extends ApiResponse<{
    user: User;
    oldRole: string;
    newRole: string;
    message: string;
  }> {}

export interface BanUserResponse
  extends ApiResponse<{
    user: User;
    banDetails: {
      reason: string;
      bannedAt: string;
      bannedUntil?: string;
      bannedBy: string;
    };
    message: string;
  }> {}

export interface UnbanUserResponse
  extends ApiResponse<{
    user: User;
    unbannedAt: string;
    message: string;
  }> {}

export interface SystemSettingsResponse
  extends ApiResponse<{
    settings: Record<string, any>;
    lastUpdated: string;
    updatedBy: string;
  }> {}

/**
 * File Upload API Responses
 */
export interface FileUploadResponse
  extends ApiResponse<{
    file: {
      id: string;
      originalName: string;
      fileName: string;
      url: string;
      size: number;
      mimeType: string;
      uploadedAt: string;
    };
    message: string;
  }> {}

export interface MultipleFileUploadResponse
  extends ApiResponse<{
    files: Array<{
      id: string;
      originalName: string;
      fileName: string;
      url: string;
      size: number;
      mimeType: string;
      uploadedAt: string;
    }>;
    successCount: number;
    failureCount: number;
    message: string;
  }> {}

export interface DeleteFileResponse
  extends ApiResponse<{
    fileId: string;
    deletedAt: string;
    message: string;
  }> {}

/**
 * Search API Responses
 */
export interface SearchResponse<T>
  extends ApiResponse<{
    results: T[];
    categories: {
      users?: T[];
      events?: T[];
      clubs?: T[];
      announcements?: T[];
    };
    pagination: PaginationMeta;
    searchTerm: string;
    searchDuration: number;
  }> {}

export interface GlobalSearchResponse
  extends SearchResponse<{
    type: 'user' | 'event' | 'club' | 'announcement';
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    relevanceScore: number;
  }> {}

/**
 * Analytics API Responses
 */
export interface AnalyticsResponse
  extends ApiResponse<{
    timeRange: {
      start: string;
      end: string;
    };
    metrics: Record<string, number>;
    trends: Array<{
      date: string;
      value: number;
      change?: number;
    }>;
    topItems: Array<{
      id: string;
      name: string;
      count: number;
      rank: number;
    }>;
  }> {}

/**
 * Notification API Responses
 */
export interface NotificationsResponse
  extends PaginatedResponse<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
  }> {}

export interface MarkNotificationReadResponse
  extends ApiResponse<{
    notificationId: string;
    markedReadAt: string;
    message: string;
  }> {}

/**
 * Health Check Response
 */
export interface HealthCheckResponse
  extends ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    services: {
      database: 'up' | 'down';
      storage: 'up' | 'down';
      email: 'up' | 'down';
      cache: 'up' | 'down';
    };
    performance: {
      responseTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  }> {}

/**
 * API Version Information Response
 */
export interface ApiVersionResponse
  extends ApiResponse<{
    currentVersion: string;
    supportedVersions: string[];
    deprecatedVersions: Array<{
      version: string;
      deprecatedSince: string;
      sunsetDate?: string;
    }>;
    latestFeatures: string[];
    migrationGuide?: string;
  }> {}

/**
 * Error Response Types
 */
export interface ValidationErrorResponse extends ApiResponse<never> {
  success: false;
  message: 'Validation failed';
  errors: Record<string, string[]>;
}

export interface AuthenticationErrorResponse extends ApiResponse<never> {
  success: false;
  message: string;
  error:
    | 'AUTHENTICATION_REQUIRED'
    | 'INVALID_CREDENTIALS'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_INVALID';
}

export interface AuthorizationErrorResponse extends ApiResponse<never> {
  success: false;
  message: string;
  error: 'INSUFFICIENT_PERMISSIONS' | 'ACCESS_DENIED' | 'ACCOUNT_SUSPENDED';
}

export interface NotFoundErrorResponse extends ApiResponse<never> {
  success: false;
  message: string;
  error: 'RESOURCE_NOT_FOUND';
}

export interface ConflictErrorResponse extends ApiResponse<never> {
  success: false;
  message: string;
  error: 'RESOURCE_CONFLICT' | 'DUPLICATE_ENTRY';
}

export interface RateLimitErrorResponse extends ApiResponse<never> {
  success: false;
  message: string;
  error: 'RATE_LIMIT_EXCEEDED';
  retryAfter: number;
}

export interface InternalServerErrorResponse extends ApiResponse<never> {
  success: false;
  message: 'Internal server error';
  error: 'INTERNAL_ERROR' | 'DATABASE_ERROR' | 'EXTERNAL_SERVICE_ERROR';
}

/**
 * Type utilities for response handling
 */
export type AnyApiResponse =
  | LoginResponse
  | RegisterResponse
  | EventResponse
  | EventsListResponse
  | ClubResponse
  | ClubsListResponse
  | ValidationErrorResponse
  | AuthenticationErrorResponse
  | NotFoundErrorResponse
  | InternalServerErrorResponse;

export type SuccessResponse<T = any> = ApiResponse<T> & { success: true };
export type ErrorResponse = ApiResponse<never> & { success: false };

/**
 * Response status indicators
 */
export type ResponseStatus = 'loading' | 'success' | 'error' | 'idle';

export interface AsyncState<T = any> {
  data: T | null;
  status: ResponseStatus;
  error: string | null;
}

/**
 * Generic API function result type
 */
export type ApiResult<T> = Promise<SuccessResponse<T> | ErrorResponse>;
