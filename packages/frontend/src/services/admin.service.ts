import { authHttpClient } from '@/lib/auth-api-client';

export interface AdminClub {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  memberCount: number;
  moderators: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
  isActive: boolean;
}

export interface CreateClubData {
  name: string;
  description: string;
  logo?: string;
}

export interface UpdateClubData extends Partial<CreateClubData> {
  isActive?: boolean;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminEvent {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  clubId?: { _id: string; name: string };
  status: string;
  registrationCount: number;
}

export const adminApi = {
  // Club Management
  clubs: {
    getAll: async (): Promise<AdminClub[]> => {
      const response = await authHttpClient.get<{
        success: boolean;
        data: AdminClub[];
      }>('/admin/clubs');
      return response.data;
    },

    getById: async (clubId: string): Promise<AdminClub> => {
      const response = await authHttpClient.get<{
        success: boolean;
        data: AdminClub;
      }>(`/admin/clubs/${clubId}`);
      return response.data;
    },

    create: async (data: CreateClubData): Promise<AdminClub> => {
      const response = await authHttpClient.post<{
        success: boolean;
        data: AdminClub;
      }>('/admin/clubs', data);
      return response.data;
    },

    update: async (
      clubId: string,
      data: UpdateClubData
    ): Promise<AdminClub> => {
      const response = await authHttpClient.put<{
        success: boolean;
        data: AdminClub;
      }>(`/admin/clubs/${clubId}`, data);
      return response.data;
    },

    delete: async (clubId: string): Promise<void> => {
      await authHttpClient.delete(`/admin/clubs/${clubId}`);
    },

    addModerator: async (clubId: string, userId: string): Promise<void> => {
      await authHttpClient.post(`/admin/clubs/${clubId}/moderators`, {
        userId,
      });
    },

    removeModerator: async (clubId: string, userId: string): Promise<void> => {
      await authHttpClient.delete(
        `/admin/clubs/${clubId}/moderators/${userId}`
      );
    },
  },

  // User Management
  users: {
    getAll: async (filters?: {
      role?: string;
      status?: string;
    }): Promise<AdminUser[]> => {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);

      const response = await authHttpClient.get<{
        success: boolean;
        data: AdminUser[];
      }>(`/admin/users?${params.toString()}`);
      return response.data;
    },

    assignRole: async (userId: string, role: string): Promise<void> => {
      await authHttpClient.put(`/admin/users/${userId}/role`, { role });
    },

    toggleStatus: async (userId: string, isActive: boolean): Promise<void> => {
      await authHttpClient.put(`/admin/users/${userId}/status`, { isActive });
    },

    delete: async (userId: string): Promise<void> => {
      await authHttpClient.delete(`/admin/users/${userId}`);
    },
  },

  // Event Management
  events: {
    getAll: async (): Promise<AdminEvent[]> => {
      const response = await authHttpClient.get<{
        success: boolean;
        data: AdminEvent[];
      }>('/admin/events');
      return response.data;
    },

    update: async (eventId: string, data: any): Promise<AdminEvent> => {
      const response = await authHttpClient.put<{
        success: boolean;
        data: AdminEvent;
      }>(`/admin/events/${eventId}`, data);
      return response.data;
    },

    delete: async (eventId: string): Promise<void> => {
      await authHttpClient.delete(`/admin/events/${eventId}`);
    },
  },
};
