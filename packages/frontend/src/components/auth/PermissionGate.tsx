'use client';

import React from 'react';
import {
  usePermissions,
  PermissionResource,
  PermissionAction,
} from '@/hooks/usePermissions';
import { UserRole } from '@event-management/shared';

interface HasPermissionProps {
  resource: PermissionResource;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on permission
 */
export function HasPermission({
  resource,
  action,
  children,
  fallback = null,
}: HasPermissionProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface HasRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 */
export function HasRole({ roles, children, fallback = null }: HasRoleProps) {
  const { role } = usePermissions();

  if (!roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface CanManageClubProps {
  clubId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on club management access
 */
export function CanManageClub({
  clubId,
  children,
  fallback = null,
}: CanManageClubProps) {
  const { canManageClub } = usePermissions();

  if (!canManageClub(clubId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface CanManageEventProps {
  eventId: string;
  eventCreatorId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on event management access
 */
export function CanManageEvent({
  eventId,
  eventCreatorId,
  children,
  fallback = null,
}: CanManageEventProps) {
  const { canManageEvent } = usePermissions();

  if (!canManageEvent(eventId, eventCreatorId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface IsAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders for admin users
 */
export function IsAdmin({ children, fallback = null }: IsAdminProps) {
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface IsModeratorProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders for moderator users
 */
export function IsModerator({ children, fallback = null }: IsModeratorProps) {
  const { isModerator } = usePermissions();

  if (!isModerator) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface IsModeratorOrAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that renders for moderator or admin users
 */
export function IsModeratorOrAdmin({
  children,
  fallback = null,
}: IsModeratorOrAdminProps) {
  const { isAdmin, isModerator } = usePermissions();

  if (!isAdmin && !isModerator) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to conditionally enable/disable UI elements based on permissions
 */
export function useConditionalPermission(
  resource: PermissionResource,
  action: PermissionAction
) {
  const { hasPermission } = usePermissions();
  return hasPermission(resource, action);
}

/**
 * Hook to get permission states for multiple resources
 */
export function useMultiplePermissions(
  checks: Array<{ resource: PermissionResource; action: PermissionAction }>
) {
  const { hasPermission } = usePermissions();

  return checks.map(({ resource, action }) => ({
    resource,
    action,
    hasPermission: hasPermission(resource, action),
  }));
}
