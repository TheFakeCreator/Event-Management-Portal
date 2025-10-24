import { httpClient } from '../api-client';
// import { User } from '@/types/user'

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  department?: string;
  year?: string;
  interests: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  eventsRegistered: number;
  eventsAttended: number;
  clubsJoined: number;
  eventsCreated?: number;
  clubsManaged?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  phone?: string;
  department?: string;
  year?: string;
  interests?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export class UsersApi {
  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/login', credentials);
  }

  /**
   * Register new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/signup', data);
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    return httpClient.post<void>('/auth/logout');
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string }> {
    return httpClient.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<UserProfile> {
    return httpClient.get<UserProfile>('/users/profile');
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    return httpClient.put<UserProfile>('/users/profile', data);
  }

  /**
   * Change password
   */
  static async changePassword(data: ChangePasswordData): Promise<void> {
    return httpClient.put<void>('/users/change-password', data);
  }

  /**
   * Upload avatar
   */
  static async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    return response.json();
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<UserStats> {
    return httpClient.get<UserStats>('/users/stats');
  }

  /**
   * Get user by ID (public profile)
   */
  static async getUserById(id: string): Promise<Partial<UserProfile>> {
    return httpClient.get<Partial<UserProfile>>(`/users/${id}`);
  }

  /**
   * Search users (admin/moderator only)
   */
  static async searchUsers(params: {
    search?: string;
    role?: 'user' | 'moderator' | 'admin';
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    users: UserProfile[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return httpClient.get('/users/search', params);
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(
    userId: string,
    role: 'user' | 'moderator' | 'admin'
  ): Promise<void> {
    return httpClient.put<void>(`/users/${userId}/role`, { role });
  }

  /**
   * Ban/unban user (admin only)
   */
  static async toggleUserStatus(
    userId: string,
    isActive: boolean
  ): Promise<void> {
    return httpClient.put<void>(`/users/${userId}/status`, { isActive });
  }

  /**
   * Delete user account
   */
  static async deleteAccount(): Promise<void> {
    return httpClient.delete<void>('/users/profile');
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    return httpClient.post<void>('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<void> {
    return httpClient.post<void>('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    return httpClient.post<void>('/auth/verify-email', { token });
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(): Promise<void> {
    return httpClient.post<void>('/auth/resend-verification');
  }
}
