import { authHttpClient } from '@/lib/auth-api-client';

interface DashboardStats {
  eventsAttended?: number;
  upcomingEvents?: number;
  clubsJoined?: number;
  pendingRegistrations?: number;
  totalClubs?: number;
  totalEvents?: number;
  totalMembers?: number;
  totalUsers?: number;
  totalRegistrations?: number;
  newUsersThisMonth?: number;
  activeEvents?: number;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  venue?: string;
  thumbnail?: string;
  registrationCount?: number;
  capacity?: number;
  status?: string;
  organizerId?: { _id: string; name: string };
  clubId?: { _id: string; name: string };
}

interface Club {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  memberCount?: number;
  upcomingEvents?: number;
}

interface PendingRegistration {
  _id: string;
  userName: string;
  userEmail: string;
  eventTitle: string;
  submittedAt: string;
}

interface RecentActivity {
  _id: string;
  user: string;
  action: string;
  resourceType: string;
  timestamp: string;
}

interface SystemHealth {
  server: {
    status: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  database: {
    status: string;
    name: string;
  };
  cache: {
    status: string;
  };
}

export const dashboardApi = {
  // User dashboard endpoints
  user: {
    getStats: async (): Promise<DashboardStats> => {
      return authHttpClient.get<DashboardStats>('/dashboard/user/stats');
    },
    getUpcomingEvents: async (limit = 5): Promise<Event[]> => {
      return authHttpClient.get<Event[]>(
        `/dashboard/user/events?limit=${limit}`
      );
    },
    getClubs: async (limit = 5): Promise<Club[]> => {
      return authHttpClient.get<Club[]>(`/dashboard/user/clubs?limit=${limit}`);
    },
  },

  // Moderator dashboard endpoints
  moderator: {
    getStats: async (): Promise<DashboardStats> => {
      return authHttpClient.get<DashboardStats>('/dashboard/moderator/stats');
    },
    getEvents: async (limit = 10): Promise<Event[]> => {
      return authHttpClient.get<Event[]>(
        `/dashboard/moderator/events?limit=${limit}`
      );
    },
    getPendingRegistrations: async (
      limit = 10
    ): Promise<PendingRegistration[]> => {
      return authHttpClient.get<PendingRegistration[]>(
        `/dashboard/moderator/registrations?limit=${limit}`
      );
    },
  },

  // Admin dashboard endpoints
  admin: {
    getStats: async (): Promise<DashboardStats> => {
      return authHttpClient.get<DashboardStats>('/dashboard/admin/stats');
    },
    getRecentActivity: async (limit = 10): Promise<RecentActivity[]> => {
      return authHttpClient.get<RecentActivity[]>(
        `/dashboard/admin/activity?limit=${limit}`
      );
    },
    getSystemHealth: async (): Promise<SystemHealth> => {
      return authHttpClient.get<SystemHealth>('/dashboard/admin/health');
    },
  },
};
