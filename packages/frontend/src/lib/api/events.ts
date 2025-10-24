import { httpClient, ApiResponse } from '../api-client';
// import { Event, EventFormData } from '@/types/event'

export interface EventsListResponse {
  events: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EventRegistration {
  id: string;
  event: string;
  user: string;
  registeredAt: Date;
  status: 'registered' | 'attended' | 'cancelled';
}

export interface EventRegistrationResponse {
  registration: EventRegistration;
}

export interface EventParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  registeredAt: Date;
  status: 'registered' | 'attended' | 'cancelled';
}

export interface EventParticipantsResponse {
  participants: EventParticipant[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class EventsApi {
  /**
   * Get all events with optional filters
   */
  static async getEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    club?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<EventsListResponse> {
    return httpClient.get<EventsListResponse>('/events', params);
  }

  /**
   * Get a specific event by ID
   */
  static async getEvent(id: string): Promise<any> {
    return httpClient.get<Event>(`/events/${id}`);
  }

  /**
   * Create a new event
   */
  static async createEvent(data: any): Promise<any> {
    return httpClient.post<Event>('/events', data);
  }

  /**
   * Update an existing event
   */
  static async updateEvent(id: string, data: Partial<any>): Promise<any> {
    return httpClient.put<Event>(`/events/${id}`, data);
  }

  /**
   * Delete an event
   */
  static async deleteEvent(id: string): Promise<void> {
    return httpClient.delete<void>(`/events/${id}`);
  }

  /**
   * Register for an event
   */
  static async registerForEvent(
    eventId: string
  ): Promise<EventRegistrationResponse> {
    return httpClient.post<EventRegistrationResponse>(
      `/events/${eventId}/register`
    );
  }

  /**
   * Unregister from an event
   */
  static async unregisterFromEvent(eventId: string): Promise<void> {
    return httpClient.delete<void>(`/events/${eventId}/register`);
  }

  /**
   * Get event participants (admin/moderator only)
   */
  static async getEventParticipants(
    eventId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: 'registered' | 'attended' | 'cancelled';
    }
  ): Promise<EventParticipantsResponse> {
    return httpClient.get<EventParticipantsResponse>(
      `/events/${eventId}/participants`,
      params
    );
  }

  /**
   * Report an event
   */
  static async reportEvent(
    eventId: string,
    data: {
      reason: string;
      description?: string;
    }
  ): Promise<void> {
    return httpClient.post<void>(`/events/${eventId}/report`, data);
  }

  /**
   * Add winners to an event (admin/moderator only)
   */
  static async addEventWinners(
    eventId: string,
    data: {
      winners: Array<{
        position: number;
        userId: string;
        prize?: string;
      }>;
    }
  ): Promise<void> {
    return httpClient.post<void>(`/events/${eventId}/winners`, data);
  }

  /**
   * Get events by club
   */
  static async getEventsByClub(
    clubId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: 'upcoming' | 'ongoing' | 'past';
    }
  ): Promise<EventsListResponse> {
    return httpClient.get<EventsListResponse>(`/events/club/${clubId}`, params);
  }

  /**
   * Get user's registered events
   */
  static async getUserEvents(params?: {
    page?: number;
    limit?: number;
    status?: 'upcoming' | 'ongoing' | 'past';
  }): Promise<EventsListResponse> {
    return httpClient.get<EventsListResponse>('/events/my-events', params);
  }
}
