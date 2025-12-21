'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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
  Users,
  Building2,
  Calendar,
  Activity,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { dashboardApi } from '@/services/dashboard.service';

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalClubs: number;
  totalRegistrations: number;
  newUsersThisMonth?: number;
  activeEvents?: number;
}

interface RecentActivity {
  _id: string;
  user: string;
  action: string;
  resourceType: string;
  timestamp: string;
}

interface SystemHealth {
  server: {
    status: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  database: {
    status: string;
    name: string;
  };
  cache: {
    status: string;
  };
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalClubs: 0,
    totalEvents: 0,
    totalRegistrations: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [statsData, activityData, healthData] = await Promise.all([
        dashboardApi.admin.getStats(),
        dashboardApi.admin.getRecentActivity(10),
        dashboardApi.admin.getSystemHealth(),
      ]);

      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalEvents: statsData.totalEvents || 0,
        totalClubs: statsData.totalClubs || 0,
        totalRegistrations: statsData.totalRegistrations || 0,
        newUsersThisMonth: statsData.newUsersThisMonth,
        activeEvents: statsData.activeEvents,
      });

      setRecentActivity(activityData);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
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
      <RoleBasedDashboardLayout
        title="Admin Dashboard"
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
        title="Admin Dashboard"
        description="Error loading data"
      >
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAdminData}>Retry</Button>
        </Card>
      </RoleBasedDashboardLayout>
    );
  }

  return (
    <RoleBasedDashboardLayout
      title="Admin Dashboard"
      description={`Welcome back, ${user?.name || 'Admin'}!`}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6 text-primary" />}
            change={
              stats.newUsersThisMonth
                ? `+${stats.newUsersThisMonth} this month`
                : undefined
            }
            trend="up"
          />
          <StatCard
            title="Total Clubs"
            value={stats.totalClubs}
            icon={<Building2 className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={<Calendar className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon={<Activity className="w-6 h-6 text-primary" />}
          />
        </div>

        {/* Platform Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/admin/audit-logs">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start space-x-3 p-3 border rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.user} {activity.action}{' '}
                        {activity.resourceType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">System Health</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/admin/settings">
                  Settings <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {systemHealth ? (
                <>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${systemHealth.database.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <span
                      className={`text-sm ${systemHealth.database.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {systemHealth.database.status === 'healthy'
                        ? 'Healthy'
                        : 'Error'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${systemHealth.server.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      <span className="text-sm font-medium">Server Uptime</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.floor(systemHealth.server.uptime / 3600)}h{' '}
                      {Math.floor((systemHealth.server.uptime % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${systemHealth.server.memory.percentage < 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span
                      className={`text-sm ${systemHealth.server.memory.percentage < 80 ? 'text-green-600' : 'text-yellow-600'}`}
                    >
                      {systemHealth.server.memory.percentage.toFixed(1)}%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Loading system health...
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/users">
                <div className="text-center">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Manage Users</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/clubs">
                <div className="text-center">
                  <Building2 className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Manage Clubs</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/analytics">
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">View Analytics</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/settings">
                <div className="text-center">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">System Settings</div>
                </div>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </RoleBasedDashboardLayout>
  );
}
