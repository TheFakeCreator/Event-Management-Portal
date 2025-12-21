import { authHttpClient } from '@/lib/auth-api-client';

export interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  clubId: string;
  capacity?: number;
  registrationDeadline?: string;
  thumbnail?: string;
  tags?: string[];
}

export interface UpdateEventData extends Partial<CreateEventData> {
  status?: 'draft' | 'published' | 'cancelled';
}

export interface ModeratorEvent {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  clubId: { _id: string; name: string };
  capacity?: number;
  registrationCount?: number;
  status: string;
  thumbnail?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClubMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar?: string;
}

export interface ModeratedClub {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  memberCount: number;
  eventCount?: number;
}

export const moderatorApi = {
  // Event Management
  events: {
    getAll: async (clubId?: string): Promise<ModeratorEvent[]> => {
      const url = clubId
        ? `/moderator/clubs/${clubId}/events`
        : '/moderator/events';
      const response = await authHttpClient.get<{
        success: boolean;
        data: ModeratorEvent[];
      }>(url);
      return response.data;
    },

    getById: async (eventId: string): Promise<ModeratorEvent> => {
      const response = await authHttpClient.get<{
        success: boolean;
        data: ModeratorEvent;
      }>(`/events/${eventId}`);
      return response.data;
    },

    create: async (data: CreateEventData): Promise<ModeratorEvent> => {
      const response = await authHttpClient.post<{
        success: boolean;
        data: ModeratorEvent;
      }>('/moderator/events', data);
      return response.data;
    },

    update: async (
      eventId: string,
      data: UpdateEventData
    ): Promise<ModeratorEvent> => {
      const response = await authHttpClient.put<{
        success: boolean;
        data: ModeratorEvent;
      }>(`/moderator/events/${eventId}`, data);
      return response.data;
    },

    delete: async (eventId: string): Promise<void> => {
      await authHttpClient.delete(`/moderator/events/${eventId}`);
    },
  },

  // Club Management
  clubs: {
    getModerated: async (): Promise<ModeratedClub[]> => {
      const response = await authHttpClient.get<{
        success: boolean;
        data: ModeratedClub[];
      }>('/moderator/clubs');
      return response.data;
    },

    getMembers: async (clubId: string): Promise<ClubMember[]> => {
      const response = await authHttpClient.get<{
        success: boolean;
        data: ClubMember[];
      }>(`/moderator/clubs/${clubId}/members`);
      return response.data;
    },

    addMember: async (clubId: string, userId: string): Promise<void> => {
      await authHttpClient.post(`/moderator/clubs/${clubId}/members`, {
        userId,
      });
    },

    removeMember: async (clubId: string, memberId: string): Promise<void> => {
      await authHttpClient.delete(
        `/moderator/clubs/${clubId}/members/${memberId}`
      );
    },

    updateMemberRole: async (
      clubId: string,
      memberId: string,
      role: string
    ): Promise<void> => {
      await authHttpClient.put(
        `/moderator/clubs/${clubId}/members/${memberId}/role`,
        { role }
      );
    },
  },

  // Registration Management
  registrations: {
    getPending: async (): Promise<any[]> => {
      const response = await authHttpClient.get<{
        success: boolean;
        data: any[];
      }>('/moderator/registrations');
      return response.data;
    },

    approve: async (registrationId: string): Promise<void> => {
      await authHttpClient.put(
        `/moderator/registrations/${registrationId}/approve`
      );
    },

    reject: async (registrationId: string): Promise<void> => {
      await authHttpClient.put(
        `/moderator/registrations/${registrationId}/reject`
      );
    },
  },
};
