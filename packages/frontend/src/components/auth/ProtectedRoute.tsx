'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@event-management/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Component to protect routes based on authentication and role
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;
  const role = (user?.role as UserRole) || 'user';

  useEffect(() => {
    // Wait for session to load
    if (isLoading) return;

    console.log('[ProtectedRoute] Auth check:', {
      isAuthenticated,
      userRole: user?.role,
      role,
      requiredRole,
      status,
    });

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo || '/auth/login');
      return;
    }

    // Check role requirement
    if (requiredRole && requiredRole.length > 0) {
      if (!user || !requiredRole.includes(role)) {
        // Redirect to appropriate dashboard based on role
        if (role === 'admin') {
          router.push('/dashboard/admin');
        } else if (role === 'moderator') {
          router.push('/dashboard/moderator');
        } else {
          router.push('/dashboard');
        }
        return;
      }
    }
  }, [
    isAuthenticated,
    user,
    role,
    isLoading,
    requireAuth,
    requiredRole,
    router,
    redirectTo,
    status,
  ]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated when auth is required
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Don't render if role requirement not met
  if (requiredRole && requiredRole.length > 0) {
    if (!user || !requiredRole.includes(role)) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component to wrap a page component with route protection
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook to use in components that need to check access
 */
export function useRouteProtection(
  requiredRole?: UserRole[],
  redirectTo?: string
) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;
  const role = (user?.role as UserRole) || 'user';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo || '/auth/login');
      return;
    }

    if (requiredRole && requiredRole.length > 0) {
      if (!user || !requiredRole.includes(role)) {
        router.push('/dashboard');
      }
    }
  }, [
    isAuthenticated,
    user,
    role,
    isLoading,
    requiredRole,
    router,
    redirectTo,
  ]);

  return {
    isLoading,
    isAuthenticated,
    hasAccess:
      isAuthenticated && (!requiredRole || requiredRole.includes(role)),
  };
}
