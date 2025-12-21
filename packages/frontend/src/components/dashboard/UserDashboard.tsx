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
import { useToast } from '@/components/ui/toast';
import {
  Calendar,
  Users,
  Trophy,
  Activity,
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { dashboardApi } from '@/services/dashboard.service';

interface DashboardStats {
  eventsAttended: number;
  upcomingEvents: number;
  clubsJoined: number;
  achievementPoints?: number;
}

interface UpcomingEvent {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  venue?: string;
  thumbnail?: string;
  organizerId?: { _id: string; name: string };
}

interface Club {
  _id: string;
  name: string;
  logo?: string;
  memberCount?: number;
  description?: string;
}

export function UserDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    eventsAttended: 0,
    upcomingEvents: 0,
    clubsJoined: 0,
    achievementPoints: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats, events, and clubs in parallel
      const [statsData, eventsData, clubsData] = await Promise.all([
        dashboardApi.user.getStats(),
        dashboardApi.user.getUpcomingEvents(5),
        dashboardApi.user.getClubs(5),
      ]);

      setStats({
        eventsAttended: statsData.eventsAttended || 0,
        upcomingEvents: statsData.upcomingEvents || 0,
        clubsJoined: statsData.clubsJoined || 0,
        achievementPoints: 0, // TODO: Implement achievement system
      });

      setUpcomingEvents(eventsData);
      setMyClubs(clubsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (loading) {
    return (
      <RoleBasedDashboardLayout title="Dashboard" description="Loading...">
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
        title="Dashboard"
        description="Error loading data"
      >
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </Card>
      </RoleBasedDashboardLayout>
    );
  }

  return (
    <RoleBasedDashboardLayout
      title="Dashboard"
      description={`Welcome back, ${user?.name || 'User'}!`}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Events Attended"
            value={stats.eventsAttended}
            icon={<Calendar className="w-6 h-6 text-primary" />}
            change="+2 this month"
            trend="up"
          />
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={<Activity className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Clubs Joined"
            value={stats.clubsJoined}
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Achievement Points"
            value={stats.achievementPoints || 0}
            icon={<Trophy className="w-6 h-6 text-primary" />}
            change="+50 this week"
            trend="up"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Upcoming Events</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.EVENTS}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <Link
                    key={event._id}
                    href={`${ROUTES.EVENTS}/${event._id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{event.title}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(event.startDate).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </div>
                          {event.venue && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {event.venue}
                            </div>
                          )}
                        </div>
                        {event.organizerId && (
                          <Badge variant="secondary" className="mt-2">
                            {event.organizerId.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href={ROUTES.EVENTS}>Browse Events</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* My Clubs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Clubs</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.CLUBS}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {myClubs.length > 0 ? (
                myClubs.map((club) => (
                  <Link
                    key={club._id}
                    href={`${ROUTES.CLUBS}/${club._id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{club.name}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span>{club.memberCount || 0} members</span>
                        </div>
                      </div>
                      <Badge variant="outline">Member</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Not a member of any clubs yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href={ROUTES.CLUBS}>Browse Clubs</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href={ROUTES.EVENTS}>
                <div className="text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Browse Events</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href={ROUTES.CLUBS}>
                <div className="text-center">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Explore Clubs</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href={ROUTES.PROFILE}>
                <div className="text-center">
                  <Activity className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">My Activity</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href={ROUTES.SETTINGS}>
                <div className="text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Achievements</div>
                </div>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </RoleBasedDashboardLayout>
  );
}
