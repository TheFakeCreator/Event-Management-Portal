'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getRouteConfig } from '@/lib/routes';
import { ROUTES } from '@/lib/constants';

// Route protection hook
export function useRouteProtection() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while auth is loading
    if (isLoading) return;

    const routeConfig = getRouteConfig(pathname);

    if (!routeConfig) return;

    // Check if route requires authentication
    if (routeConfig.requireAuth && !isAuthenticated) {
      // Store the intended destination
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${ROUTES.LOGIN}?returnUrl=${returnUrl}`);
      return;
    }

    // Check if route requires admin access
    if (routeConfig.adminOnly && (!user || user.role !== 'admin')) {
      router.push(ROUTES.DASHBOARD);
      return;
    }

    // Redirect authenticated users away from auth pages
    if (
      isAuthenticated &&
      (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER)
    ) {
      router.push(ROUTES.DASHBOARD);
      return;
    }
  }, [pathname, isAuthenticated, user, isLoading, router]);

  return {
    isProtecting: isLoading,
    routeConfig: getRouteConfig(pathname),
  };
}

// Navigation utilities
export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    const routeConfig = getRouteConfig(path);

    // Check if user can access this route
    if (routeConfig?.requireAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(path);
      router.push(`${ROUTES.LOGIN}?returnUrl=${returnUrl}`);
      return false;
    }

    if (routeConfig?.adminOnly && (!user || user.role !== 'admin')) {
      return false;
    }

    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }

    return true;
  };

  const goBack = () => {
    router.back();
  };

  const canAccessRoute = (path: string): boolean => {
    const routeConfig = getRouteConfig(path);
    if (!routeConfig) return true;

    if (routeConfig.requireAuth && !isAuthenticated) return false;
    if (routeConfig.adminOnly && (!user || user.role !== 'admin')) return false;

    return true;
  };

  const isCurrentRoute = (path: string): boolean => {
    return pathname === path;
  };

  const isCurrentSection = (path: string): boolean => {
    return pathname.startsWith(path);
  };

  return {
    pathname,
    navigateTo,
    goBack,
    canAccessRoute,
    isCurrentRoute,
    isCurrentSection,
    router,
  };
}

// Route-based page metadata
export function usePageMetadata() {
  const pathname = usePathname();
  const routeConfig = getRouteConfig(pathname);

  return {
    title: routeConfig?.title,
    description: routeConfig?.description,
    requireAuth: routeConfig?.requireAuth,
    adminOnly: routeConfig?.adminOnly,
    showInNav: routeConfig?.showInNav,
    showInSidebar: routeConfig?.showInSidebar,
  };
}

// URL query parameter utilities
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();

  const setQueryParam = (key: string, value: string | null) => {
    const url = new URL(window.location.href);

    if (value === null || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }

    router.push(`${pathname}?${url.searchParams.toString()}`, {
      scroll: false,
    });
  };

  const getQueryParam = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    return url.searchParams.get(key);
  };

  const removeQueryParam = (key: string) => {
    setQueryParam(key, null);
  };

  const setMultipleQueryParams = (params: Record<string, string | null>) => {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    router.push(`${pathname}?${url.searchParams.toString()}`, {
      scroll: false,
    });
  };

  return {
    setQueryParam,
    getQueryParam,
    removeQueryParam,
    setMultipleQueryParams,
  };
}

// Breadcrumb utilities
export function useBreadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{
      label: string;
      href: string;
      current?: boolean;
    }> = [];

    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const routeConfig = getRouteConfig(currentPath);
      const isLast = i === segments.length - 1;

      breadcrumbs.push({
        label:
          routeConfig?.title ||
          segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
        href: currentPath,
        current: isLast,
      });
    }

    return breadcrumbs;
  };

  return {
    breadcrumbs: generateBreadcrumbs(),
    pathname,
  };
}
