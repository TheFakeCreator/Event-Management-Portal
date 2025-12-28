'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Users,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ClubAnalyticsData {
  clubName: string;
  memberGrowth: Array<{ month: string; members: number; active: number }>;
  eventPerformance: Array<{
    event: string;
    registrations: number;
    attendance: number;
  }>;
  engagementTrend: Array<{ date: string; engagement: number }>;
  topEvents: Array<{ title: string; attendees: number; rating: number }>;
}

export default function ClubAnalyticsPage() {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']}>
      <ClubAnalytics />
    </ProtectedRoute>
  );
}

function ClubAnalytics() {
  const params = useParams();
  const { toast } = useToast();
  const clubId = params.clubId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');
  const [data, setData] = useState<ClubAnalyticsData>({
    clubName: '',
    memberGrowth: [],
    eventPerformance: [],
    engagementTrend: [],
    topEvents: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [clubId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setData({
        clubName: 'Tech Club',
        memberGrowth: [
          { month: 'Jan', members: 45, active: 38 },
          { month: 'Feb', members: 52, active: 44 },
          { month: 'Mar', members: 58, active: 51 },
          { month: 'Apr', members: 65, active: 58 },
          { month: 'May', members: 72, active: 64 },
          { month: 'Jun', members: 78, active: 70 },
        ],
        eventPerformance: [
          { event: 'Workshop 1', registrations: 45, attendance: 38 },
          { event: 'Workshop 2', registrations: 52, attendance: 48 },
          { event: 'Hackathon', registrations: 68, attendance: 65 },
          { event: 'Seminar', registrations: 42, attendance: 40 },
        ],
        engagementTrend: [
          { date: 'Week 1', engagement: 72 },
          { date: 'Week 2', engagement: 78 },
          { date: 'Week 3', engagement: 75 },
          { date: 'Week 4', engagement: 82 },
          { date: 'Week 5', engagement: 85 },
          { date: 'Week 6', engagement: 88 },
        ],
        topEvents: [
          { title: 'Annual Hackathon', attendees: 65, rating: 4.8 },
          { title: 'AI Workshop Series', attendees: 48, rating: 4.6 },
          { title: 'Tech Talk: Web3', attendees: 40, rating: 4.5 },
          { title: 'Code Challenge', attendees: 38, rating: 4.4 },
        ],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        message: 'Failed to load analytics data',
        type: 'error',
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
      message: 'Club analytics data is being exported...',
      type: 'success',
    });
    // TODO: Implement export functionality
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/moderator">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data.clubName} Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Detailed insights into club performance and engagement
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {(['30d', '90d', '1y'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '30d' && 'Last 30 Days'}
            {range === '90d' && 'Last 90 Days'}
            {range === '1y' && 'Last Year'}
          </Button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold mt-1">78</p>
              <p className="text-xs text-green-600 mt-1">+8% from last month</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Members</p>
              <p className="text-2xl font-bold mt-1">70</p>
              <p className="text-xs text-green-600 mt-1">89.7% engagement</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Events Hosted</p>
              <p className="text-2xl font-bold mt-1">12</p>
              <p className="text-xs text-green-600 mt-1">+3 from last month</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Member Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="members"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Total Members"
              />
              <Area
                type="monotone"
                dataKey="active"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Active Members"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Event Performance Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Event Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.eventPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="registrations"
                fill="#8884d8"
                name="Registrations"
              />
              <Bar dataKey="attendance" fill="#82ca9d" name="Attendance" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Engagement Trend Chart */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.engagementTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#8884d8"
                strokeWidth={2}
                name="Engagement Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Events Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-3 font-medium">Event</th>
                <th className="pb-3 font-medium">Attendees</th>
                <th className="pb-3 font-medium">Rating</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.topEvents.map((event, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{event.title}</td>
                  <td className="py-3">{event.attendees}</td>
                  <td className="py-3">
                    <span className="text-yellow-600">★ {event.rating}</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Event Attendance</p>
          <p className="text-2xl font-bold mt-2">47.75</p>
          <p className="text-xs text-muted-foreground mt-1">per event</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Attendance Rate</p>
          <p className="text-2xl font-bold mt-2">89.2%</p>
          <p className="text-xs text-green-600 mt-1">+3.5% from last month</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Member Satisfaction</p>
          <p className="text-2xl font-bold mt-2">4.6/5</p>
          <p className="text-xs text-muted-foreground mt-1">
            based on feedback
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Growth Rate</p>
          <p className="text-2xl font-bold mt-2">+12.5%</p>
          <p className="text-xs text-muted-foreground mt-1">last 3 months</p>
        </Card>
      </div>
    </div>
  );
}
