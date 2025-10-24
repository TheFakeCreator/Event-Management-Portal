import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EventsApi,
  EventsListResponse,
  EventParticipantsResponse,
} from '@/lib/api/events';
import { queryKeys } from '@/lib/query-client';
// import { Event, EventFormData } from '@/types/event'
import { toast } from 'sonner';

// Queries
export function useEvents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  club?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.eventsList(params),
    queryFn: () => EventsApi.getEvents(params),
  });
}

export function useEvent(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventDetail(id),
    queryFn: () => EventsApi.getEvent(id),
    enabled: enabled && !!id,
  });
}

export function useEventParticipants(
  eventId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: 'registered' | 'attended' | 'cancelled';
  },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.eventParticipants(eventId),
    queryFn: () => EventsApi.getEventParticipants(eventId, params),
    enabled: enabled && !!eventId,
  });
}

export function useUserEvents(params?: {
  page?: number;
  limit?: number;
  status?: 'upcoming' | 'ongoing' | 'past';
}) {
  return useQuery({
    queryKey: queryKeys.userEvents(params),
    queryFn: () => EventsApi.getUserEvents(params),
  });
}

export function useEventsByClub(
  clubId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: 'upcoming' | 'ongoing' | 'past';
  },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.eventsList({ ...params, club: clubId }),
    queryFn: () => EventsApi.getEventsByClub(clubId, params),
    enabled: enabled && !!clubId,
  });
}

// Mutations
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => EventsApi.createEvent(data),
    onSuccess: (newEvent) => {
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: queryKeys.events() });

      // Update cache with new event
      queryClient.setQueryData(queryKeys.eventDetail(newEvent.id), newEvent);

      toast.success('Event created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create event');
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<any>) => EventsApi.updateEvent(eventId, data),
    onSuccess: (updatedEvent) => {
      // Update specific event in cache
      queryClient.setQueryData(queryKeys.eventDetail(eventId), updatedEvent);

      // Invalidate events list to update any filtered views
      queryClient.invalidateQueries({ queryKey: queryKeys.events() });

      toast.success('Event updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update event');
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => EventsApi.deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.eventDetail(eventId) });

      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: queryKeys.events() });

      toast.success('Event deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete event');
    },
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => EventsApi.registerForEvent(eventId),
    onSuccess: (_, eventId) => {
      // Invalidate event details to update registration status
      queryClient.invalidateQueries({
        queryKey: queryKeys.eventDetail(eventId),
      });

      // Invalidate user events
      queryClient.invalidateQueries({ queryKey: queryKeys.userEvents() });

      toast.success('Successfully registered for event!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to register for event');
    },
  });
}

export function useUnregisterFromEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => EventsApi.unregisterFromEvent(eventId),
    onSuccess: (_, eventId) => {
      // Invalidate event details to update registration status
      queryClient.invalidateQueries({
        queryKey: queryKeys.eventDetail(eventId),
      });

      // Invalidate user events
      queryClient.invalidateQueries({ queryKey: queryKeys.userEvents() });

      toast.success('Successfully unregistered from event!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unregister from event');
    },
  });
}

export function useReportEvent() {
  return useMutation({
    mutationFn: ({
      eventId,
      reason,
      description,
    }: {
      eventId: string;
      reason: string;
      description?: string;
    }) => EventsApi.reportEvent(eventId, { reason, description }),
    onSuccess: () => {
      toast.success('Event reported successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to report event');
    },
  });
}

export function useAddEventWinners() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      winners,
    }: {
      eventId: string;
      winners: Array<{
        position: number;
        userId: string;
        prize?: string;
      }>;
    }) => EventsApi.addEventWinners(eventId, { winners }),
    onSuccess: (_, { eventId }) => {
      // Invalidate event details to show updated winners
      queryClient.invalidateQueries({
        queryKey: queryKeys.eventDetail(eventId),
      });

      toast.success('Winners added successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add winners');
    },
  });
}
