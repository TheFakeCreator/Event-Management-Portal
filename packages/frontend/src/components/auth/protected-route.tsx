'use client';

import React from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      fallback || (
        <MainLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </MainLayout>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login via useRequireAuth
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();

  // Public routes can be accessed by anyone
  return <>{children}</>;
}

interface AuthOnlyRouteProps {
  children: React.ReactNode;
}

export function AuthOnlyRoute({ children }: AuthOnlyRouteProps) {
  // These routes should redirect authenticated users away
  return <>{children}</>;
}
