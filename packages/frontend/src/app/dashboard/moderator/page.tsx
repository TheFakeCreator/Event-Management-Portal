'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ModeratorDashboard } from '@/components/dashboard/ModeratorDashboard';

export default function ModeratorDashboardPage() {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']}>
      <ModeratorDashboard />
    </ProtectedRoute>
  );
}
