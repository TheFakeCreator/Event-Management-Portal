'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route labels mapping
const routeLabels: Record<string, string> = {
  [ROUTES.HOME]: 'Home',
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.EVENTS]: 'Events',
  [ROUTES.CLUBS]: 'Clubs',
  [ROUTES.PROFILE]: 'Profile',
  [ROUTES.SETTINGS]: 'Settings',
  [ROUTES.ABOUT]: 'About',
  [ROUTES.LOGIN]: 'Sign In',
  [ROUTES.REGISTER]: 'Sign Up',
  [ROUTES.CREATE_EVENT]: 'Create Event',
  [ROUTES.CREATE_CLUB]: 'Create Club',
  '/explore': 'Explore',
  '/explore/trending': 'Trending Events',
  '/explore/featured-clubs': 'Featured Clubs',
  '/explore/categories': 'Categories',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/events/my-events': 'My Events',
  '/events/analytics': 'Event Analytics',
  '/clubs/my-clubs': 'My Clubs',
};

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  for (let i = 0; i < paths.length; i++) {
    currentPath += `/${paths[i]}`;
    const isLast = i === paths.length - 1;

    // Get label from mapping or fallback to formatted path segment
    let label = routeLabels[currentPath];

    if (!label) {
      // Format path segment as label (e.g., 'my-events' -> 'My Events')
      label = paths[i]
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Handle dynamic routes (IDs, etc.)
      if (label.match(/^[a-f0-9]{24}$/i) || label.match(/^\d+$/)) {
        label = 'Details';
      }
    }

    breadcrumbs.push({
      label,
      href: currentPath,
      current: isLast,
    });
  }

  return breadcrumbs;
}

export function Breadcrumbs({
  items,
  className,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Use provided items or generate from pathname
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  // Don't show breadcrumbs on home page unless explicitly provided
  if (!items && pathname === ROUTES.HOME) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground',
        className
      )}
    >
      {showHome && pathname !== ROUTES.HOME && (
        <>
          <Link
            href={ROUTES.HOME}
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">Home</span>
          </Link>
          {breadcrumbItems.length > 0 && <ChevronRight className="w-4 h-4" />}
        </>
      )}

      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && <ChevronRight className="w-4 h-4" />}

          {item.current ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Predefined breadcrumb configurations for common pages
export const breadcrumbConfigs = {
  eventDetails: (eventTitle: string, eventId: string): BreadcrumbItem[] => [
    { label: 'Events', href: ROUTES.EVENTS },
    { label: eventTitle, href: `${ROUTES.EVENTS}/${eventId}`, current: true },
  ],

  clubDetails: (clubName: string, clubId: string): BreadcrumbItem[] => [
    { label: 'Clubs', href: ROUTES.CLUBS },
    { label: clubName, href: `${ROUTES.CLUBS}/${clubId}`, current: true },
  ],

  userProfile: (userName: string, userId: string): BreadcrumbItem[] => [
    { label: 'Users', href: '/users' },
    { label: userName, href: `/users/${userId}`, current: true },
  ],

  createEvent: (): BreadcrumbItem[] => [
    { label: 'Events', href: ROUTES.EVENTS },
    { label: 'Create Event', href: ROUTES.CREATE_EVENT, current: true },
  ],

  createClub: (): BreadcrumbItem[] => [
    { label: 'Clubs', href: ROUTES.CLUBS },
    { label: 'Create Club', href: ROUTES.CREATE_CLUB, current: true },
  ],

  editEvent: (eventTitle: string, eventId: string): BreadcrumbItem[] => [
    { label: 'Events', href: ROUTES.EVENTS },
    { label: eventTitle, href: `${ROUTES.EVENTS}/${eventId}` },
    { label: 'Edit', href: `${ROUTES.EVENTS}/${eventId}/edit`, current: true },
  ],

  editClub: (clubName: string, clubId: string): BreadcrumbItem[] => [
    { label: 'Clubs', href: ROUTES.CLUBS },
    { label: clubName, href: `${ROUTES.CLUBS}/${clubId}` },
    { label: 'Edit', href: `${ROUTES.CLUBS}/${clubId}/edit`, current: true },
  ],

  accountSettings: (): BreadcrumbItem[] => [
    { label: 'Profile', href: ROUTES.PROFILE },
    { label: 'Settings', href: ROUTES.SETTINGS, current: true },
  ],

  adminDashboard: (): BreadcrumbItem[] => [
    { label: 'Admin', href: '/admin', current: true },
  ],

  adminUsers: (): BreadcrumbItem[] => [
    { label: 'Admin', href: '/admin' },
    { label: 'Users', href: '/admin/users', current: true },
  ],

  adminEvents: (): BreadcrumbItem[] => [
    { label: 'Admin', href: '/admin' },
    { label: 'Events', href: '/admin/events', current: true },
  ],
};

// Hook for easy breadcrumb management
export function useBreadcrumbs() {
  const pathname = usePathname();

  return {
    pathname,
    generateFromPath: () => generateBreadcrumbsFromPath(pathname),
    configs: breadcrumbConfigs,
  };
}
