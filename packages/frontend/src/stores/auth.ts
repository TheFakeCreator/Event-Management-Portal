import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { httpClient } from '@/lib/api-client';

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  moderatorClubs?: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
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
}

export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: false,
        error: null,

        // Actions
        setUser: (user) => {
          set({ user, isAuthenticated: !!user }, false, 'auth/setUser');
        },

        setTokens: (token, refreshToken) => {
          httpClient.setAuthToken(token);
          set(
            { token, refreshToken, isAuthenticated: true },
            false,
            'auth/setTokens'
          );
        },

        setLoading: (isLoading) => {
          set({ isLoading }, false, 'auth/setLoading');
        },

        setHydrated: (isHydrated) => {
          set({ isHydrated }, false, 'auth/setHydrated');
        },

        setError: (error) => {
          set({ error }, false, 'auth/setError');
        },

        clearError: () => {
          set({ error: null }, false, 'auth/clearError');
        },

        login: async (email, password) => {
          const { setLoading, setError, setUser, setTokens } = get();

          try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Login failed');
            }

            setTokens(data.token, data.refreshToken);
            setUser(data.user);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Login failed');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        register: async (registerData) => {
          const { setLoading, setError, setUser, setTokens } = get();

          try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(registerData),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Registration failed');
            }

            setTokens(data.token, data.refreshToken);
            setUser(data.user);
          } catch (error) {
            setError(
              error instanceof Error ? error.message : 'Registration failed'
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        logout: async () => {
          const { setLoading, setError, reset } = get();

          try {
            setLoading(true);
            setError(null);

            // Call logout API to invalidate tokens on server
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${get().token}`,
              },
            });
          } catch (error) {
            // Don't throw on logout errors, just log them
            console.error('Logout error:', error);
          } finally {
            // Always clear local state
            httpClient.clearAuthToken();
            reset();
            setLoading(false);
          }
        },

        refreshTokens: async () => {
          const { refreshToken, setTokens, reset } = get();

          if (!refreshToken) {
            reset();
            throw new Error('No refresh token available');
          }

          try {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Token refresh failed');
            }

            setTokens(data.token, refreshToken);
            return data.token;
          } catch (error) {
            reset();
            throw error;
          }
        },

        updateProfile: async (profileData) => {
          const { setLoading, setError, setUser, user } = get();

          if (!user) throw new Error('No user logged in');

          try {
            setLoading(true);
            setError(null);

            const response = await httpClient.put(
              '/users/profile',
              profileData
            );
            setUser(response as User);
          } catch (error) {
            setError(
              error instanceof Error ? error.message : 'Profile update failed'
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        changePassword: async (currentPassword, newPassword) => {
          const { setLoading, setError } = get();

          try {
            setLoading(true);
            setError(null);

            await httpClient.put('/users/change-password', {
              currentPassword,
              newPassword,
              confirmPassword: newPassword,
            });
          } catch (error) {
            setError(
              error instanceof Error ? error.message : 'Password change failed'
            );
            throw error;
          } finally {
            setLoading(false);
          }
        },

        reset: () => {
          set(
            {
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            },
            false,
            'auth/reset'
          );
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Hydration error:', error);
          }

          console.log('[Auth Store] Rehydrating:', {
            hasState: !!state,
            hasToken: !!state?.token,
            hasUser: !!state?.user,
            userRole: state?.user?.role,
            isAuthenticated: state?.isAuthenticated,
          });

          // Set auth token when rehydrating from storage
          if (state?.token) {
            httpClient.setAuthToken(state.token);
          }
          // Mark as hydrated using the setter
          if (state) {
            state.setHydrated(true);
          }
        },
      }
    ),
    { name: 'auth-store' }
  )
);
