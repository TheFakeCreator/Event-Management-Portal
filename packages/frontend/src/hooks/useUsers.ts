import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UsersApi,
  UserProfile,
  UserStats,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  ChangePasswordData,
} from '@/lib/api/users';
import { queryKeys } from '@/lib/query-client';
import { httpClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Queries
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: () => UsersApi.getProfile(),
    retry: false, // Don't retry auth failures
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.userStats(),
    queryFn: () => UsersApi.getUserStats(),
  });
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userDetail(id),
    queryFn: () => UsersApi.getUserById(id),
    enabled: enabled && !!id,
  });
}

export function useSearchUsers(params: {
  search?: string;
  role?: 'user' | 'moderator' | 'admin';
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.users(), 'search', params],
    queryFn: () => UsersApi.searchUsers(params),
    enabled: !!params.search || Object.keys(params).length > 0,
  });
}

// Authentication Mutations
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => UsersApi.login(credentials),
    onSuccess: (response) => {
      // Store tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Set auth header
      httpClient.setAuthToken(response.token);

      // Update user profile cache
      queryClient.setQueryData(queryKeys.userProfile(), response.user);

      toast.success('Successfully logged in!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Login failed');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => UsersApi.register(data),
    onSuccess: (response) => {
      // Store tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Set auth header
      httpClient.setAuthToken(response.token);

      // Update user profile cache
      queryClient.setQueryData(queryKeys.userProfile(), response.user);

      toast.success('Account created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Registration failed');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => UsersApi.logout(),
    onSuccess: () => {
      // Clear tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Clear auth header
      httpClient.clearAuthToken();

      // Clear all cached data
      queryClient.clear();

      toast.success('Successfully logged out!');
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      httpClient.clearAuthToken();
      queryClient.clear();

      toast.error(error?.message || 'Logout failed');
    },
  });
}

// Profile Mutations
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => UsersApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      // Update user profile cache
      queryClient.setQueryData(queryKeys.userProfile(), updatedProfile);

      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => UsersApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to change password');
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => UsersApi.uploadAvatar(file),
    onSuccess: (response) => {
      // Update user profile cache with new avatar
      queryClient.setQueryData(
        queryKeys.userProfile(),
        (old: UserProfile | undefined) =>
          old ? { ...old, avatar: response.avatar } : old
      );

      toast.success('Avatar updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload avatar');
    },
  });
}

// Admin Mutations
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: 'user' | 'moderator' | 'admin';
    }) => UsersApi.updateUserRole(userId, role),
    onSuccess: (_, { userId }) => {
      // Invalidate user details
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(userId) });

      // Invalidate search results
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.users(), 'search'],
      });

      toast.success('User role updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user role');
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      UsersApi.toggleUserStatus(userId, isActive),
    onSuccess: (_, { userId, isActive }) => {
      // Invalidate user details
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(userId) });

      // Invalidate search results
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.users(), 'search'],
      });

      toast.success(
        `User ${isActive ? 'activated' : 'deactivated'} successfully!`
      );
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user status');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => UsersApi.deleteAccount(),
    onSuccess: () => {
      // Clear tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Clear auth header
      httpClient.clearAuthToken();

      // Clear all cached data
      queryClient.clear();

      toast.success('Account deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete account');
    },
  });
}

// Password Reset
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => UsersApi.requestPasswordReset(email),
    onSuccess: () => {
      toast.success('Password reset email sent!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send reset email');
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({
      token,
      password,
      confirmPassword,
    }: {
      token: string;
      password: string;
      confirmPassword: string;
    }) => UsersApi.resetPassword(token, password, confirmPassword),
    onSuccess: () => {
      toast.success('Password reset successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reset password');
    },
  });
}

// Email Verification
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => UsersApi.verifyEmail(token),
    onSuccess: () => {
      toast.success('Email verified successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to verify email');
    },
  });
}

export function useResendEmailVerification() {
  return useMutation({
    mutationFn: () => UsersApi.resendEmailVerification(),
    onSuccess: () => {
      toast.success('Verification email sent!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send verification email');
    },
  });
}
