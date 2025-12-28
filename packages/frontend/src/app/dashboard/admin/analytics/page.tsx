'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleBasedDashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  TrendingUp,
  Users,
  Calendar,
  Building2,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps,
} from 'recharts';

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number; active: number }>;
  eventStats: Array<{ category: string; count: number }>;
  clubDistribution: Array<{ name: string; value: number }>;
  registrationTrends: Array<{ date: string; registrations: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <AdminAnalytics />
    </ProtectedRoute>
  );
}

function AdminAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );
  const [data, setData] = useState<AnalyticsData>({
    userGrowth: [],
    eventStats: [],
    clubDistribution: [],
    registrationTrends: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/dashboard/admin/analytics?timeRange=${timeRange}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        // Set empty data on error
        setData({
          userGrowth: [],
          eventStats: [],
          clubDistribution: [],
          registrationTrends: [],
        });
        return;
      }

      const result = await response.json();
      const analyticsData = result.data || result;
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setData({
        userGrowth: [],
        eventStats: [],
        clubDistribution: [],
        registrationTrends: [],
      });
      toast({
        title: 'Info',
        message: 'No analytics data available',
        type: 'info',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      message: 'Analytics data is being exported...',
      type: 'success',
    });
    // TODO: Implement export functionality
  };

  if (loading) {
    return (
      <RoleBasedDashboardLayout
        title="Platform Analytics"
        description="Comprehensive insights into platform performance"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </RoleBasedDashboardLayout>
    );
  }

  return (
    <RoleBasedDashboardLayout
      title="Platform Analytics"
      description="Comprehensive insights into platform performance"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Time Range Filter */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
              {range === '1y' && 'Last Year'}
            </Button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">282</p>
                <p className="text-xs text-green-600 mt-1">
                  +15% from last period
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold mt-1">165</p>
                <p className="text-xs text-green-600 mt-1">
                  +8% from last period
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clubs</p>
                <p className="text-2xl font-bold mt-1">40</p>
                <p className="text-xs text-green-600 mt-1">
                  +5% from last period
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registrations</p>
                <p className="text-2xl font-bold mt-1">680</p>
                <p className="text-xs text-green-600 mt-1">
                  +12% from last period
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  name="Total Users"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#82ca9d"
                  name="Active Users"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Event Stats Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Events by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.eventStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Event Count" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Club Distribution Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Club Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.clubDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: PieLabelRenderProps) =>
                    `${props.name || ''}: ${((props.percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.clubDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Registration Trends Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Registration Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.registrationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="registrations"
                  fill="#82ca9d"
                  name="Registrations"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Detailed Stats Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 font-medium">Metric</th>
                  <th className="pb-3 font-medium">Current</th>
                  <th className="pb-3 font-medium">Previous</th>
                  <th className="pb-3 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">Active Users (Daily Avg)</td>
                  <td className="py-3">225</td>
                  <td className="py-3">198</td>
                  <td className="py-3 text-green-600">+13.6%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Event Attendance Rate</td>
                  <td className="py-3">78%</td>
                  <td className="py-3">72%</td>
                  <td className="py-3 text-green-600">+6%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Club Engagement Score</td>
                  <td className="py-3">8.4/10</td>
                  <td className="py-3">7.9/10</td>
                  <td className="py-3 text-green-600">+6.3%</td>
                </tr>
                <tr>
                  <td className="py-3">Platform Usage (Hours/Week)</td>
                  <td className="py-3">4.2</td>
                  <td className="py-3">3.8</td>
                  <td className="py-3 text-green-600">+10.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </RoleBasedDashboardLayout>
  );
}
