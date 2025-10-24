import { httpClient } from '../api-client';

export interface ClubsListResponse {
  clubs: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClubMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  status: 'active' | 'inactive' | 'banned';
}

export interface ClubMembersResponse {
  members: ClubMember[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClubJoinResponse {
  membership: {
    id: string;
    club: string;
    user: string;
    role: 'member';
    joinedAt: Date;
    status: 'active';
  };
}

export interface ClubSponsor {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  tier: 'gold' | 'silver' | 'bronze';
  amount?: number;
}

export interface ClubSponsorsResponse {
  sponsors: ClubSponsor[];
}

export class ClubsApi {
  /**
   * Get all clubs with optional filters
   */
  static async getClubs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sort?: 'name' | 'members' | 'events' | 'created';
  }): Promise<ClubsListResponse> {
    return httpClient.get<ClubsListResponse>('/clubs', params);
  }

  /**
   * Get a specific club by ID
   */
  static async getClub(id: string): Promise<any> {
    return httpClient.get<any>(`/clubs/${id}`);
  }

  /**
   * Create a new club
   */
  static async createClub(data: any): Promise<any> {
    return httpClient.post<any>('/clubs', data);
  }

  /**
   * Update an existing club
   */
  static async updateClub(id: string, data: Partial<any>): Promise<any> {
    return httpClient.put<any>(`/clubs/${id}`, data);
  }

  /**
   * Delete a club
   */
  static async deleteClub(id: string): Promise<void> {
    return httpClient.delete<void>(`/clubs/${id}`);
  }

  /**
   * Join a club
   */
  static async joinClub(clubId: string): Promise<ClubJoinResponse> {
    return httpClient.post<ClubJoinResponse>(`/clubs/${clubId}/join`);
  }

  /**
   * Leave a club
   */
  static async leaveClub(clubId: string): Promise<void> {
    return httpClient.delete<void>(`/clubs/${clubId}/join`);
  }

  /**
   * Get club members
   */
  static async getClubMembers(
    clubId: string,
    params?: {
      page?: number;
      limit?: number;
      role?: 'member' | 'moderator' | 'admin';
      status?: 'active' | 'inactive' | 'banned';
    }
  ): Promise<ClubMembersResponse> {
    return httpClient.get<ClubMembersResponse>(
      `/clubs/${clubId}/members`,
      params
    );
  }

  /**
   * Update member role (admin/moderator only)
   */
  static async updateMemberRole(
    clubId: string,
    userId: string,
    role: 'member' | 'moderator' | 'admin'
  ): Promise<void> {
    return httpClient.put<void>(`/clubs/${clubId}/members/${userId}/role`, {
      role,
    });
  }

  /**
   * Remove member from club (admin/moderator only)
   */
  static async removeMember(clubId: string, userId: string): Promise<void> {
    return httpClient.delete<void>(`/clubs/${clubId}/members/${userId}`);
  }

  /**
   * Get club sponsors
   */
  static async getClubSponsors(clubId: string): Promise<ClubSponsorsResponse> {
    return httpClient.get<ClubSponsorsResponse>(`/clubs/${clubId}/sponsors`);
  }

  /**
   * Add club sponsor (admin/moderator only)
   */
  static async addClubSponsor(
    clubId: string,
    data: {
      name: string;
      logo?: string;
      website?: string;
      tier: 'gold' | 'silver' | 'bronze';
      amount?: number;
    }
  ): Promise<ClubSponsor> {
    return httpClient.post<ClubSponsor>(`/clubs/${clubId}/sponsors`, data);
  }

  /**
   * Update club sponsor (admin/moderator only)
   */
  static async updateClubSponsor(
    clubId: string,
    sponsorId: string,
    data: Partial<{
      name: string;
      logo?: string;
      website?: string;
      tier: 'gold' | 'silver' | 'bronze';
      amount?: number;
    }>
  ): Promise<ClubSponsor> {
    return httpClient.put<ClubSponsor>(
      `/clubs/${clubId}/sponsors/${sponsorId}`,
      data
    );
  }

  /**
   * Delete club sponsor (admin/moderator only)
   */
  static async deleteClubSponsor(
    clubId: string,
    sponsorId: string
  ): Promise<void> {
    return httpClient.delete<void>(`/clubs/${clubId}/sponsors/${sponsorId}`);
  }

  /**
   * Get clubs user is a member of
   */
  static async getUserClubs(params?: {
    page?: number;
    limit?: number;
    role?: 'member' | 'moderator' | 'admin';
  }): Promise<ClubsListResponse> {
    return httpClient.get<ClubsListResponse>('/clubs/my-clubs', params);
  }

  /**
   * Get club statistics (admin/moderator only)
   */
  static async getClubStats(clubId: string): Promise<{
    members: {
      total: number;
      active: number;
      newThisMonth: number;
    };
    events: {
      total: number;
      upcoming: number;
      thisMonth: number;
    };
    registrations: {
      total: number;
      thisMonth: number;
    };
  }> {
    return httpClient.get(`/clubs/${clubId}/stats`);
  }
}
