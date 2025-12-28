import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { useSession } from 'next-auth/react';
import { UserRole } from '@event-management/shared';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestChild = () => <div>Protected Content</div>;

  describe('Authentication Check', () => {
    it('should redirect to login when user is not authenticated', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading state while checking authentication', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      // Loading state may not have testId, just check content not shown
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render children when user is authenticated', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
          },
        },
        status: 'authenticated',
      });

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has required role', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
        status: 'authenticated',
      });

      render(
        <ProtectedRoute requiredRole={['admin' as UserRole]}>
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow access when user role is in array of required roles', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Moderator User',
            email: 'mod@example.com',
            role: 'moderator',
          },
        },
        status: 'authenticated',
      });

      render(
        <ProtectedRoute
          requiredRole={['moderator' as UserRole, 'admin' as UserRole]}
        >
          <TestChild />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to dashboard when user lacks required role', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Regular User',
            email: 'user@example.com',
            role: 'user',
          },
        },
        status: 'authenticated',
      });

      render(
        <ProtectedRoute requiredRole={['admin' as UserRole]}>
          <TestChild />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect when user role not in array of required roles', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Regular User',
            email: 'user@example.com',
            role: 'user',
          },
        },
        status: 'authenticated',
      });

      render(
        <ProtectedRoute
          requiredRole={['moderator' as UserRole, 'admin' as UserRole]}
        >
          <TestChild />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect admin to admin dashboard when accessing moderator-only routes', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
        status: 'authenticated',
      });

      render(
        <ProtectedRoute requiredRole={['moderator' as UserRole]}>
          <TestChild />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/admin');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should handle user without role property', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        },
        status: 'authenticated',
      });

      render(
        <ProtectedRoute requiredRole={['admin' as UserRole]}>
          <TestChild />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should not redirect multiple times on re-render', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      const callCount = mockPush.mock.calls.length;

      // Wait a bit to ensure no additional redirects
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not have called push again
      expect(mockPush).toHaveBeenCalledTimes(callCount);
    });
  });
});
