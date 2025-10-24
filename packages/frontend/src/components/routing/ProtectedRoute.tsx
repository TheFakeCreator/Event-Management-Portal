'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouteProtection } from '@/hooks/useRouting';
import { LoadingSpinner } from '@/components/ui';
import { ErrorLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Shield, Lock, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  fallback,
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isProtecting } = useRouteProtection();
  const router = useRouter();

  // Show loading while authentication is being checked
  if (isLoading || isProtecting) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    return (
      <ErrorLayout>
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Authentication Required
        </h1>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to access this page.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => router.push('/auth/login')}>Sign In</Button>
        </div>
      </ErrorLayout>
    );
  }

  // Check admin requirement
  if (requireAdmin && (!user || user.role !== 'admin')) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    return (
      <ErrorLayout>
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have permission to access this page.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </ErrorLayout>
    );
  }

  // Render fallback if provided and conditions not met
  if (
    fallback &&
    ((requireAuth && !isAuthenticated) ||
      (requireAdmin && (!user || user.role !== 'admin')))
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    fallback?: React.ReactNode;
  } = {}
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;

  return ProtectedComponent;
}

// Specific route protection components
export function AuthRequired({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireAuth>{children}</ProtectedRoute>;
}

export function AdminRequired({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth requireAdmin>
      {children}
    </ProtectedRoute>
  );
}

// Route guard for redirecting authenticated users (e.g., from login page)
interface GuestOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestOnlyRoute({
  children,
  redirectTo = '/dashboard',
}: GuestOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
