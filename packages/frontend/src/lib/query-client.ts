import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Background refetch interval
      refetchInterval: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistent naming
export const queryKeys = {
  all: ['app'] as const,

  // Events
  events: () => [...queryKeys.all, 'events'] as const,
  eventsList: (filters?: Record<string, any>) =>
    [...queryKeys.events(), 'list', filters] as const,
  eventDetail: (id: string) => [...queryKeys.events(), 'detail', id] as const,
  eventParticipants: (id: string) =>
    [...queryKeys.events(), 'participants', id] as const,
  userEvents: (filters?: Record<string, any>) =>
    [...queryKeys.events(), 'user', filters] as const,

  // Clubs
  clubs: () => [...queryKeys.all, 'clubs'] as const,
  clubsList: (filters?: Record<string, any>) =>
    [...queryKeys.clubs(), 'list', filters] as const,
  clubDetail: (id: string) => [...queryKeys.clubs(), 'detail', id] as const,
  clubMembers: (id: string) => [...queryKeys.clubs(), 'members', id] as const,
  clubSponsors: (id: string) => [...queryKeys.clubs(), 'sponsors', id] as const,
  clubStats: (id: string) => [...queryKeys.clubs(), 'stats', id] as const,
  userClubs: (filters?: Record<string, any>) =>
    [...queryKeys.clubs(), 'user', filters] as const,

  // Users
  users: () => [...queryKeys.all, 'users'] as const,
  userProfile: () => [...queryKeys.users(), 'profile'] as const,
  userStats: () => [...queryKeys.users(), 'stats'] as const,
  userDetail: (id: string) => [...queryKeys.users(), 'detail', id] as const,
} as const;
