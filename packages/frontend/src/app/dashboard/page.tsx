'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui';
import { DashboardStatsLoading } from '@/components/ui/loading-states';
import { useToast } from '@/components/ui/toast';
import {
  Calendar,
  Users,
  Trophy,
  Clock,
  MapPin,
  Star,
  Bell,
  Settings,
  Plus,
  ChevronRight,
  Activity,
  Award,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore, usePreferencesStore, useGlobalLoading } from '@/stores';
import { ProtectedRoute } from '@/components/routing';

// Mock dashboard data (this would come from API)
const mockDashboardData = {
  user: {
    _id: 'user123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '/images/avatars/john.jpg',
    joinedDate: '2023-01-15',
    stats: {
      eventsAttended: 23,
      eventsCreated: 7,
      clubsJoined: 4,
      achievementPoints: 1250,
    },
  },
  quickStats: {
    upcomingEvents: 3,
    pendingInvitations: 2,
    newNotifications: 5,
    favoriteEvents: 8,
  },
  upcomingEvents: [
    {
      _id: 'event1',
      title: 'React Next.js Workshop',
      date: '2025-10-20',
      time: '14:00',
      location: 'Tech Hub, Downtown',
      club: 'Tech Enthusiasts Club',
      status: 'registered',
      imageUrl: '/images/events/react-workshop.jpg',
    },
    {
      _id: 'event2',
      title: 'AI/ML Study Group',
      date: '2025-10-22',
      time: '18:00',
      location: 'Innovation Center',
      club: 'Data Science Society',
      status: 'interested',
      imageUrl: '/images/events/ai-study.jpg',
    },
    {
      _id: 'event3',
      title: 'Startup Pitch Night',
      date: '2025-10-25',
      time: '19:00',
      location: 'Entrepreneur Hub',
      club: 'Entrepreneur Society',
      status: 'registered',
      imageUrl: '/images/events/pitch-night.jpg',
    },
  ],
  myClubs: [
    {
      _id: 'club1',
      name: 'Tech Enthusiasts Club',
      logo: '/images/clubs/tech-club.jpg',
      role: 'Member',
      memberCount: 127,
      upcomingEvents: 2,
    },
    {
      _id: 'club2',
      name: 'Photography Society',
      logo: '/images/clubs/photo-club.jpg',
      role: 'Admin',
      memberCount: 89,
      upcomingEvents: 1,
    },
    {
      _id: 'club3',
      name: 'Book Lovers Club',
      logo: '/images/clubs/book-club.jpg',
      role: 'Member',
      memberCount: 45,
      upcomingEvents: 3,
    },
  ],
  recentActivity: [
    {
      id: 1,
      type: 'event_registration',
      title: 'Registered for React Workshop',
      description: 'You successfully registered for the React Next.js Workshop',
      timestamp: '2024-01-10T10:00:00Z',
      icon: Calendar,
    },
    {
      id: 2,
      type: 'club_joined',
      title: 'Joined Tech Enthusiasts Club',
      description: 'Welcome to the Tech Enthusiasts Club community!',
      timestamp: '2024-01-08T15:30:00Z',
      icon: Users,
    },
    {
      id: 3,
      type: 'achievement',
      title: 'Earned Active Participant Badge',
      description: "You've attended 5 events this month",
      timestamp: '2024-01-05T12:00:00Z',
      icon: Trophy,
    },
    {
      id: 4,
      type: 'event_created',
      title: 'Created JavaScript Fundamentals Event',
      description: 'Your event has been published and is now live',
      timestamp: '2024-01-03T09:15:00Z',
      icon: Plus,
    },
  ],
  achievements: [
    {
      id: 1,
      name: 'Event Enthusiast',
      description: 'Attended 20+ events',
      icon: Calendar,
      earned: true,
      earnedDate: '2024-01-01',
    },
    {
      id: 2,
      name: 'Community Builder',
      description: 'Created 5+ events',
      icon: Users,
      earned: true,
      earnedDate: '2023-12-15',
    },
    {
      id: 3,
      name: 'Early Adopter',
      description: 'Joined in the first year',
      icon: Star,
      earned: true,
      earnedDate: '2023-01-15',
    },
    {
      id: 4,
      name: 'Network Master',
      description: 'Join 10+ clubs',
      icon: Award,
      earned: false,
    },
  ],
  recommendations: [
    {
      type: 'event',
      title: 'Web Development Bootcamp',
      description: 'Based on your interest in React workshops',
      eventId: 'event4',
      club: 'Coding Academy',
    },
    {
      type: 'club',
      title: 'JavaScript Developers United',
      description: 'Perfect match for your programming interests',
      clubId: 'club4',
      memberCount: 234,
    },
  ],
};

export default function DashboardPage() {
  // Use both legacy hook and new store for compatibility
  const { user: legacyUser } = useAuth();
  const { user: storeUser } = useAuthStore();
  const { dashboard: dashboardPrefs } = usePreferencesStore();
  const isLoading = useGlobalLoading();
  const { success, error, info } = useToast();

  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(false);

  // Use store user if available, fallback to legacy
  const user = storeUser || legacyUser;

  useEffect(() => {
    // Simulate loading dashboard data
    if (user) {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        setDashboardData((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            name: user.name || 'User',
            email: user.email || 'user@example.com',
          },
        }));
        setLoading(false);

        // Show welcome toast
        info('Welcome back!', `Good to see you again, ${user.name || 'User'}`);
      }, 1000);
    }
    // TODO: Fetch dashboard data from API
    // fetchDashboardData()
  }, [user, info]);

  const handleEventRegister = (eventTitle: string) => {
    success(
      'Registration Successful!',
      `You've been registered for ${eventTitle}`
    );
  };

  const handleClubJoin = (clubName: string) => {
    success('Joined Club!', `Welcome to ${clubName}`);
  };

  const handleNotificationClick = () => {
    info('Notifications', 'All caught up! No new notifications.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-8">
          <DashboardStatsLoading />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events Loading */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
                <div className="h-9 w-20 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                        <div className="flex gap-4">
                          <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-12 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Clubs Loading */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
                <div className="h-9 w-20 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-2/3 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 w-1/3 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <DashboardLayout
        title="Welcome back!"
        description="Here's what's happening in your community"
        actions={
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <Link href={ROUTES.CREATE_EVENT}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {dashboardData.quickStats.upcomingEvents}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upcoming Events
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {dashboardData.user.stats.clubsJoined}
                  </p>
                  <p className="text-sm text-muted-foreground">Clubs Joined</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {dashboardData.user.stats.achievementPoints}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Achievement Points
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {dashboardData.quickStats.newNotifications}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New Notifications
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Upcoming Events</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href={ROUTES.EVENTS}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {dashboardData.upcomingEvents.map((event) => (
                  <Card
                    key={event._id}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              '/images/placeholder-event.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">
                              <Link
                                href={`${ROUTES.EVENTS}/${event._id}`}
                                className="hover:text-primary"
                              >
                                {event.title}
                              </Link>
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {event.club}
                            </p>
                          </div>
                          <Badge
                            variant={
                              event.status === 'registered'
                                ? 'default'
                                : 'secondary'
                            }
                            className="capitalize"
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* My Clubs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Clubs</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href={ROUTES.CLUBS}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {dashboardData.myClubs.map((club) => (
                  <Card
                    key={club._id}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {club.logo ? (
                          <img
                            src={club.logo}
                            alt={club.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/images/default-club.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {club.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">
                            <Link
                              href={`${ROUTES.CLUBS}/${club._id}`}
                              className="hover:text-primary"
                            >
                              {club.name}
                            </Link>
                          </h3>
                          <Badge
                            variant={
                              club.role === 'Admin' ? 'default' : 'secondary'
                            }
                          >
                            {club.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{club.memberCount} members</span>
                          <span>{club.upcomingEvents} upcoming events</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Button variant="outline" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>

              <Card className="p-6">
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {activity.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Achievements & Recommendations */}
            <div className="space-y-6">
              {/* Achievements */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Achievements</h2>
                <Card className="p-6">
                  <div className="space-y-3">
                    {dashboardData.achievements
                      .slice(0, 3)
                      .map((achievement) => {
                        const Icon = achievement.icon;
                        return (
                          <div
                            key={achievement.id}
                            className="flex items-center gap-3"
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                achievement.earned
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-medium text-sm ${
                                  achievement.earned
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {achievement.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {achievement.description}
                              </p>
                            </div>
                            {achievement.earned && (
                              <Trophy className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All Achievements
                  </Button>
                </Card>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recommended</h2>
                <div className="space-y-3">
                  {dashboardData.recommendations.map((rec, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {rec.type}
                          </Badge>
                          <Star className="w-3 h-3 text-yellow-500" />
                        </div>
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {rec.description}
                        </p>
                        <Button size="sm" className="w-full" asChild>
                          <Link
                            href={
                              rec.type === 'event'
                                ? `${ROUTES.EVENTS}/${rec.eventId}`
                                : `${ROUTES.CLUBS}/${rec.clubId}`
                            }
                          >
                            View {rec.type}
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                asChild
              >
                <Link href={ROUTES.CREATE_EVENT}>
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Create Event</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                asChild
              >
                <Link href={ROUTES.CLUBS}>
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Find Clubs</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                asChild
              >
                <Link href={ROUTES.PROFILE}>
                  <User className="w-6 h-6" />
                  <span className="text-sm">Edit Profile</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                asChild
              >
                <Link href={ROUTES.SETTINGS}>
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">Settings</span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
