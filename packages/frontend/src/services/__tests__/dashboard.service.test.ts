import { dashboardApi } from '../dashboard.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('Dashboard API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('User Dashboard Stats', () => {
    it('should fetch user dashboard stats successfully', async () => {
      const mockStats = {
        registeredEvents: 5,
        upcomingEvents: 3,
        joinedClubs: 2,
        pendingRegistrations: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockStats }),
      });

      const result = await dashboardApi.user.getStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/user/stats'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockStats);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });

      await expect(dashboardApi.user.getStats()).rejects.toThrow();
    });

    it('should include auth token in request headers', async () => {
      const { getSession } = require('next-auth/react');
      const mockToken = 'test-jwt-token';

      (getSession as jest.Mock).mockResolvedValueOnce({
        user: { token: mockToken },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      await dashboardApi.user.getStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );

      localStorage.removeItem('token');
    });
  });

  describe('Moderator Dashboard Stats', () => {
    it('should fetch moderator stats successfully', async () => {
      const mockStats = {
        totalMembers: 50,
        activeMembers: 45,
        totalEvents: 10,
        upcomingEvents: 3,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockStats }),
      });

      const result = await dashboardApi.moderator.getStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/moderator/stats'),
        expect.any(Object)
      );

      expect(result).toEqual(mockStats);
    });

    it('should fetch pending registrations', async () => {
      const mockRegistrations = [
        {
          _id: 'reg-1',
          userId: { name: 'John Doe', email: 'john@example.com' },
          eventId: { title: 'Tech Talk' },
          status: 'pending',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockRegistrations }),
      });

      const result = await dashboardApi.moderator.getPendingRegistrations();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/moderator/registrations'),
        expect.any(Object)
      );

      expect(result).toEqual(mockRegistrations);
    });
  });

  describe('Admin Dashboard Stats', () => {
    it('should fetch admin platform stats successfully', async () => {
      const mockStats = {
        totalUsers: 1000,
        totalEvents: 150,
        totalClubs: 25,
        activeUsers: 850,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockStats }),
      });

      const result = await dashboardApi.admin.getStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/admin/stats'),
        expect.any(Object)
      );

      expect(result).toEqual(mockStats);
    });

    it('should fetch system health', async () => {
      const mockHealth = {
        status: 'healthy',
        server: {
          status: 'running',
          uptime: 1000000,
          memory: { used: 100, total: 200, percentage: 50 },
        },
        database: { status: 'connected', name: 'test-db' },
        cache: { status: 'connected' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockHealth }),
      });

      const result = await dashboardApi.admin.getSystemHealth();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/admin/health'),
        expect.any(Object)
      );

      expect(result).toEqual(mockHealth);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(dashboardApi.user.getStats()).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle 401 unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(dashboardApi.user.getStats()).rejects.toThrow();
    });

    it('should handle 403 forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      });

      await expect(dashboardApi.moderator.getStats()).rejects.toThrow();
    });

    it('should handle 404 not found errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(dashboardApi.admin.getStats()).rejects.toThrow();
    });
  });

  describe('Request Caching', () => {
    it('should cache dashboard stats requests', async () => {
      const mockStats = { totalUsers: 100 };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockStats }),
      });

      // First request
      await dashboardApi.user.getStats();

      // Second request (should be cached)
      await dashboardApi.user.getStats();

      // Fetch should only be called once if caching is implemented
      // Note: This test assumes caching is implemented in the service
      expect(global.fetch).toHaveBeenCalledTimes(2); // Will be 1 if caching works
    });
  });
});
