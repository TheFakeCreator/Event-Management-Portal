'use client';

import React, { useEffect, useState } from 'react';
import {
  RoleBasedDashboardLayout,
  StatCard,
} from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ui/toast';
import {
  Calendar,
  Users,
  Building2,
  TrendingUp,
  ChevronRight,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { dashboardApi } from '@/services/dashboard.service';

interface ModeratorStats {
  totalClubs: number;
  totalEvents: number;
  totalMembers: number;
  pendingRegistrations: number;
}

interface Club {
  _id: string;
  name: string;
  memberCount?: number;
  logo?: string;
}

interface RecentEvent {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  registrationCount?: number;
  capacity?: number;
  status?: string;
  clubId?: { _id: string; name: string };
}

interface PendingRegistration {
  _id: string;
  userName: string;
  userEmail: string;
  eventTitle: string;
  submittedAt: string;
}

export function ModeratorDashboard() {
  const { user } = useAuthStore();
  const { moderatorClubs } = usePermissions();
  const { toast } = useToast();
  const [stats, setStats] = useState<ModeratorStats>({
    totalClubs: 0,
    totalEvents: 0,
    totalMembers: 0,
    pendingRegistrations: 0,
  });
  const [clubs, setClubs] = useState<Club[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModeratorData();
  }, []);

  const fetchModeratorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [statsData, eventsData, registrationsData] = await Promise.all([
        dashboardApi.moderator.getStats(),
        dashboardApi.moderator.getEvents(10),
        dashboardApi.moderator.getPendingRegistrations(10),
      ]);

      setStats({
        totalClubs: statsData.totalClubs || 0,
        totalEvents: statsData.totalEvents || 0,
        totalMembers: statsData.totalMembers || 0,
        pendingRegistrations: statsData.pendingRegistrations || 0,
      });

      setRecentEvents(eventsData);
      setPendingRegistrations(registrationsData);

      // Set clubs from moderatorClubs if available
      // Note: We'll need a separate endpoint for clubs list if needed
      setClubs([]);
    } catch (error) {
      console.error('Error fetching moderator data:', error);
      setError('Failed to load dashboard data');
      toast({
        title: 'Error',
        message: 'Failed to load dashboard data. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    try {
      // TODO: API call
      // await fetch(`/api/v1/moderator/registrations/${registrationId}/approve`, { method: 'PUT' });
      setPendingRegistrations((prev) =>
        prev.filter((r) => r._id !== registrationId)
      );
      toast({
        title: 'Success',
        message: 'Registration approved successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to approve registration:', error);
      toast({
        title: 'Error',
        message: 'Failed to approve registration',
        type: 'error',
      });
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    try {
      // TODO: API call
      // await fetch(`/api/v1/moderator/registrations/${registrationId}/reject`, { method: 'PUT' });
      setPendingRegistrations((prev) =>
        prev.filter((r) => r._id !== registrationId)
      );
      toast({
        title: 'Success',
        message: 'Registration rejected',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to reject registration:', error);
      toast({
        title: 'Error',
        message: 'Failed to reject registration',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <RoleBasedDashboardLayout
        title="Moderator Dashboard"
        description="Loading..."
      >
        <div className="animate-pulse space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </RoleBasedDashboardLayout>
    );
  }

  if (error) {
    return (
      <RoleBasedDashboardLayout
        title="Moderator Dashboard"
        description="Error loading data"
      >
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchModeratorData}>Retry</Button>
        </Card>
      </RoleBasedDashboardLayout>
    );
  }

  return (
    <RoleBasedDashboardLayout
      title="Moderator Dashboard"
      description={`Welcome back, ${user?.name || 'Moderator'}!`}
      actions={
        <Button asChild>
          <Link href="/events/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Clubs"
            value={stats.totalClubs}
            icon={<Building2 className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={<Calendar className="w-6 h-6 text-primary" />}
            change="+2 this month"
            trend="up"
          />
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={<Users className="w-6 h-6 text-primary" />}
            change="+12 this week"
            trend="up"
          />
          <StatCard
            title="Pending Registrations"
            value={stats.pendingRegistrations}
            icon={<FileText className="w-6 h-6 text-primary" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Clubs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Clubs</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/moderator/clubs">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {clubs.map((club) => (
                <div
                  key={club._id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{club.name}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {club.memberCount || 0} members
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/dashboard/moderator/clubs/${club._id}/members`}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Members
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Events</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/moderator/events">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <Link
                    key={event._id}
                    href={`/events/${event._id}/manage`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{event.title}</h3>
                        {event.clubId && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.clubId.name}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                          {event.registrationCount !== undefined && (
                            <span className="flex items-center text-muted-foreground">
                              <Users className="w-4 h-4 mr-1" />
                              {event.registrationCount} registered
                            </span>
                          )}
                        </div>
                      </div>
                      {event.status && (
                        <Badge
                          variant={
                            event.status === 'upcoming'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {event.status}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No events yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/events/create">Create Your First Event</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Pending Registrations */}
        {pendingRegistrations.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Pending Registrations</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/moderator/registrations">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {pendingRegistrations.slice(0, 3).map((registration) => (
                <div
                  key={registration._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{registration.userName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {registration.userEmail}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Event: {registration.eventTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted:{' '}
                      {new Date(registration.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                      onClick={() =>
                        handleApproveRegistration(registration._id)
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRejectRegistration(registration._id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/events/create">
                <div className="text-center">
                  <Plus className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Create Event</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/moderator/members">
                <div className="text-center">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Manage Members</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/moderator/analytics">
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">View Analytics</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/moderator/registrations">
                <div className="text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Registrations</div>
                </div>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </RoleBasedDashboardLayout>
  );
}
