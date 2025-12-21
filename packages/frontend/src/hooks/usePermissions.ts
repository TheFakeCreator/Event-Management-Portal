import { useSession } from 'next-auth/react';
import { UserRole } from '@event-management/shared';
import { useMemo } from 'react';

/**
 * Permission actions that can be performed
 */
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage';

/**
 * Resources that permissions apply to
 */
export type PermissionResource =
  | 'event'
  | 'club'
  | 'user'
  | 'registration'
  | 'announcement';

/**
 * Permission matrix defining what each role can do
 */
const PERMISSION_MATRIX: Record<
  UserRole,
  Record<PermissionResource, PermissionAction[]>
> = {
  admin: {
    event: ['create', 'read', 'update', 'delete', 'manage'],
    club: ['create', 'read', 'update', 'delete', 'manage'],
    user: ['create', 'read', 'update', 'delete', 'manage'],
    registration: ['create', 'read', 'update', 'delete', 'manage'],
    announcement: ['create', 'read', 'update', 'delete', 'manage'],
  },
  moderator: {
    event: ['create', 'read', 'update', 'delete'],
    club: ['read', 'update'],
    user: ['read'],
    registration: ['read', 'update'],
    announcement: ['create', 'read', 'update', 'delete'],
  },
  member: {
    event: ['read'],
    club: ['read'],
    user: ['read'],
    registration: ['read'],
    announcement: ['read'],
  },
  user: {
    event: ['read'],
    club: ['read'],
    user: ['read'],
    registration: ['create', 'read', 'delete'],
    announcement: ['read'],
  },
};

/**
 * Route access matrix defining which routes each role can access
 */
const ROUTE_ACCESS: Record<UserRole, string[]> = {
  admin: [
    '/dashboard',
    '/dashboard/admin',
    '/dashboard/admin/users',
    '/dashboard/admin/clubs',
    '/dashboard/admin/events',
    '/dashboard/admin/analytics',
    '/dashboard/admin/settings',
    '/dashboard/admin/audit-logs',
    '/events',
    '/events/create',
    '/events/:id',
    '/events/:id/edit',
    '/events/:id/manage',
    '/clubs',
    '/clubs/:id',
    '/clubs/:id/manage',
    '/profile',
    '/settings',
  ],
  moderator: [
    '/dashboard',
    '/dashboard/moderator',
    '/dashboard/moderator/:clubId',
    '/events',
    '/events/create',
    '/events/:id',
    '/events/:id/edit',
    '/events/:id/manage',
    '/clubs',
    '/clubs/:id',
    '/clubs/:id/manage',
    '/clubs/:id/members',
    '/clubs/:id/analytics',
    '/profile',
    '/settings',
  ],
  member: [
    '/dashboard',
    '/events',
    '/events/:id',
    '/clubs',
    '/clubs/:id',
    '/profile',
    '/settings',
  ],
  user: [
    '/dashboard',
    '/events',
    '/events/:id',
    '/clubs',
    '/clubs/:id',
    '/profile',
    '/settings',
  ],
};

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const user = session?.user as any;

  const permissions = useMemo(() => {
    if (!isAuthenticated || !user) {
      return {
        role: 'user' as UserRole,
        isAdmin: false,
        isModerator: false,
        moderatorClubs: [],
      };
    }

    return {
      role: (user.role as UserRole) || 'user',
      isAdmin: user.role === 'admin',
      isModerator: user.role === 'moderator',
      moderatorClubs: user.moderatorClubs || [],
    };
  }, [user, isAuthenticated]);

  /**
   * Check if user has permission to perform an action on a resource
   */
  const hasPermission = (
    resource: PermissionResource,
    action: PermissionAction
  ): boolean => {
    if (!isAuthenticated || !user) return false;

    const rolePermissions = PERMISSION_MATRIX[user.role as UserRole];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  };

  /**
   * Check if user can access a specific route
   */
  const canAccessRoute = (route: string): boolean => {
    if (!isAuthenticated || !user) return false;

    const allowedRoutes = ROUTE_ACCESS[user.role as UserRole];
    if (!allowedRoutes) return false;

    // Check exact match
    if (allowedRoutes.includes(route)) return true;

    // Check pattern match (for dynamic routes like /events/:id)
    return allowedRoutes.some((allowedRoute: string) => {
      const pattern = allowedRoute.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(route);
    });
  };

  /**
   * Check if user can manage a specific club
   */
  const canManageClub = (clubId: string): boolean => {
    if (!isAuthenticated || !user) return false;

    // Admins can manage all clubs
    if (user.role === 'admin') return true;

    // Moderators can only manage their clubs
    if (user.role === 'moderator') {
      return (user.moderatorClubs || []).includes(clubId);
    }

    return false;
  };

  /**
   * Check if user can manage an event
   * This is a basic check - actual ownership should be verified with backend
   */
  const canManageEvent = (
    eventId: string,
    eventCreatorId?: string
  ): boolean => {
    if (!isAuthenticated || !user) return false;

    // Admins can manage all events
    if (user.role === 'admin') return true;

    // Check if user is the creator
    if (eventCreatorId && user._id === eventCreatorId) return true;

    // Moderators can manage events from their clubs (needs club check)
    return user.role === 'moderator';
  };

  /**
   * Check if user can create events
   */
  const canCreateEvent = (): boolean => {
    return hasPermission('event', 'create');
  };

  /**
   * Check if user can create clubs
   */
  const canCreateClub = (): boolean => {
    return hasPermission('club', 'create');
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = (): boolean => {
    return hasPermission('user', 'manage');
  };

  /**
   * Get dashboard route based on role
   */
  const getDashboardRoute = (): string => {
    if (!isAuthenticated || !user) return '/dashboard';

    switch (user.role) {
      case 'admin':
        return '/dashboard/admin';
      case 'moderator':
        return '/dashboard/moderator';
      default:
        return '/dashboard';
    }
  };

  return {
    ...permissions,
    hasPermission,
    canAccessRoute,
    canManageClub,
    canManageEvent,
    canCreateEvent,
    canCreateClub,
    canManageUsers,
    getDashboardRoute,
  };
}
