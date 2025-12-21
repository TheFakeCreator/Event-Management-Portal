'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { LoadingSpinner } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const authLoading = status === 'loading';
  const user = session?.user;
  const { role } = usePermissions();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Redirect admin/moderator to their respective dashboards
    if (!authLoading && isAuthenticated && user) {
      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else if (role === 'moderator') {
        router.push('/dashboard/moderator');
      }
    }
  }, [isAuthenticated, authLoading, role, user, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Show user dashboard for regular users
  if (role === 'user' || role === 'member') {
    return <UserDashboard />;
  }

  // Redirecting message
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );
}
