import { getSession, signOut } from 'next-auth/react';
import { API_CONFIG, ApiError } from './api-client';

/**
 * HTTP client that uses NextAuth session for authentication
 */
class NextAuthHttpClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get auth token from NextAuth session
   */
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const session = await getSession();

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthHttpClient] Session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!session?.user?.token,
      });
    }

    return session?.user?.token || null;
  }

  /**
   * Make HTTP request with NextAuth token
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Use Next.js API routes as proxy instead of calling backend directly
    // This ensures proper authentication token forwarding
    const url = `/api/${endpoint.replace(/^\//, '')}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge with options headers
    if (options.headers) {
      const optionsHeaders = options.headers as Record<string, string>;
      Object.assign(headers, optionsHeaders);
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError = new ApiError(
          errorData.message || `HTTP Error: ${response.status}`,
          response.status,
          errorData.code
        );

        // Handle token expiration - auto logout and redirect to login
        if (
          response.status === 401 &&
          (errorData.message?.includes('expired') ||
            errorData.message?.includes('invalid') ||
            errorData.code === 'TOKEN_EXPIRED')
        ) {
          console.log('[AuthHttpClient] Token expired, logging out...');
          await signOut({ redirect: false });
          window.location.href = '/auth/login?error=SessionExpired';
        }

        throw apiError;
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params)}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const authHttpClient = new NextAuthHttpClient();
