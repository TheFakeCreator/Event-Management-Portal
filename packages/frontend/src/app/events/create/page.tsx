'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { LazyEventCreationForm } from '@/lib/lazy-components';

export default function CreateEventPage() {
  return (
    <ProtectedRoute requireAuth requiredRole={['moderator', 'admin']}>
      <DashboardLayout
        title="Create Event"
        description="Create a new event for your community"
        actions={
          <Button variant="outline" asChild>
            <Link href={ROUTES.EVENTS}>Cancel</Link>
          </Button>
        }
      >
        <div className="max-w-4xl mx-auto">
          <LazyEventCreationForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
