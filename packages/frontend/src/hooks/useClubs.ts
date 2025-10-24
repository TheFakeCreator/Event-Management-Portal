import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClubsApi,
  ClubsListResponse,
  ClubMembersResponse,
  ClubSponsorsResponse,
} from '@/lib/api/clubs';
import { queryKeys } from '@/lib/query-client';
// import { Club, any } from '@/types/club'
import { toast } from 'sonner';

// Queries
export function useClubs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: 'name' | 'members' | 'events' | 'created';
}) {
  return useQuery({
    queryKey: queryKeys.clubsList(params),
    queryFn: () => ClubsApi.getClubs(params),
  });
}

export function useClub(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubDetail(id),
    queryFn: () => ClubsApi.getClub(id),
    enabled: enabled && !!id,
  });
}

export function useClubMembers(
  clubId: string,
  params?: {
    page?: number;
    limit?: number;
    role?: 'member' | 'moderator' | 'admin';
    status?: 'active' | 'inactive' | 'banned';
  },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.clubMembers(clubId),
    queryFn: () => ClubsApi.getClubMembers(clubId, params),
    enabled: enabled && !!clubId,
  });
}

export function useClubSponsors(clubId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubSponsors(clubId),
    queryFn: () => ClubsApi.getClubSponsors(clubId),
    enabled: enabled && !!clubId,
  });
}

export function useClubStats(clubId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubStats(clubId),
    queryFn: () => ClubsApi.getClubStats(clubId),
    enabled: enabled && !!clubId,
  });
}

export function useUserClubs(params?: {
  page?: number;
  limit?: number;
  role?: 'member' | 'moderator' | 'admin';
}) {
  return useQuery({
    queryKey: queryKeys.userClubs(params),
    queryFn: () => ClubsApi.getUserClubs(params),
  });
}

// Mutations
export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => ClubsApi.createClub(data),
    onSuccess: (newClub) => {
      // Invalidate clubs list
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs() });

      // Update cache with new club
      queryClient.setQueryData(queryKeys.clubDetail(newClub.id), newClub);

      toast.success('Club created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create club');
    },
  });
}

export function useUpdateClub(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<any>) => ClubsApi.updateClub(clubId, data),
    onSuccess: (updatedClub) => {
      // Update specific club in cache
      queryClient.setQueryData(queryKeys.clubDetail(clubId), updatedClub);

      // Invalidate clubs list to update any filtered views
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs() });

      toast.success('Club updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update club');
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: string) => ClubsApi.deleteClub(clubId),
    onSuccess: (_, clubId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.clubDetail(clubId) });

      // Invalidate clubs list
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs() });

      toast.success('Club deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete club');
    },
  });
}

export function useJoinClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: string) => ClubsApi.joinClub(clubId),
    onSuccess: (_, clubId) => {
      // Invalidate club details to update membership status
      queryClient.invalidateQueries({ queryKey: queryKeys.clubDetail(clubId) });

      // Invalidate club members
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubMembers(clubId),
      });

      // Invalidate user clubs
      queryClient.invalidateQueries({ queryKey: queryKeys.userClubs() });

      toast.success('Successfully joined club!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to join club');
    },
  });
}

export function useLeaveClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clubId: string) => ClubsApi.leaveClub(clubId),
    onSuccess: (_, clubId) => {
      // Invalidate club details to update membership status
      queryClient.invalidateQueries({ queryKey: queryKeys.clubDetail(clubId) });

      // Invalidate club members
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubMembers(clubId),
      });

      // Invalidate user clubs
      queryClient.invalidateQueries({ queryKey: queryKeys.userClubs() });

      toast.success('Successfully left club!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to leave club');
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clubId,
      userId,
      role,
    }: {
      clubId: string;
      userId: string;
      role: 'member' | 'moderator' | 'admin';
    }) => ClubsApi.updateMemberRole(clubId, userId, role),
    onSuccess: (_, { clubId }) => {
      // Invalidate club members to show updated role
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubMembers(clubId),
      });

      toast.success('Member role updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update member role');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clubId, userId }: { clubId: string; userId: string }) =>
      ClubsApi.removeMember(clubId, userId),
    onSuccess: (_, { clubId }) => {
      // Invalidate club members to show updated list
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubMembers(clubId),
      });

      // Invalidate club details to update member count
      queryClient.invalidateQueries({ queryKey: queryKeys.clubDetail(clubId) });

      toast.success('Member removed successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove member');
    },
  });
}

export function useAddClubSponsor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clubId,
      ...data
    }: {
      clubId: string;
      name: string;
      logo?: string;
      website?: string;
      tier: 'gold' | 'silver' | 'bronze';
      amount?: number;
    }) => ClubsApi.addClubSponsor(clubId, data),
    onSuccess: (_, { clubId }) => {
      // Invalidate club sponsors to show new sponsor
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubSponsors(clubId),
      });

      toast.success('Sponsor added successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add sponsor');
    },
  });
}

export function useUpdateClubSponsor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clubId,
      sponsorId,
      ...data
    }: {
      clubId: string;
      sponsorId: string;
      name?: string;
      logo?: string;
      website?: string;
      tier?: 'gold' | 'silver' | 'bronze';
      amount?: number;
    }) => ClubsApi.updateClubSponsor(clubId, sponsorId, data),
    onSuccess: (_, { clubId }) => {
      // Invalidate club sponsors to show updated sponsor
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubSponsors(clubId),
      });

      toast.success('Sponsor updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update sponsor');
    },
  });
}

export function useDeleteClubSponsor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clubId,
      sponsorId,
    }: {
      clubId: string;
      sponsorId: string;
    }) => ClubsApi.deleteClubSponsor(clubId, sponsorId),
    onSuccess: (_, { clubId }) => {
      // Invalidate club sponsors to show updated list
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubSponsors(clubId),
      });

      toast.success('Sponsor deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete sponsor');
    },
  });
}
