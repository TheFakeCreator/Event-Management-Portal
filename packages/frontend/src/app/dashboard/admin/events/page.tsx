'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  RoleBasedDashboardLayout,
  StatCard,
} from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
type EventCategory =
  | 'technical'
  | 'cultural'
  | 'sports'
  | 'academic'
  | 'social';

interface Event {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  registeredCount: number;
  organizer: {
    _id: string;
    name: string;
  };
  club?: {
    _id: string;
    name: string;
  };
  imageUrl?: string;
  createdAt: string;
}

export default function AdminEventsPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <AdminEventsManagement />
    </ProtectedRoute>
  );
}

function AdminEventsManagement() {
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, categoryFilter, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/events', {
        credentials: 'include',
      });

      if (!response.ok) {
        setEvents([]);
        setFilteredEvents([]);
        return;
      }

      const result = await response.json();
      const eventsData = result.data?.events || result.events || [];
      setEvents(eventsData);
      setFilteredEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
      setFilteredEvents([]);
      toast({
        title: 'Info',
        message: 'No events data available',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.organizer.name.toLowerCase().includes(query) ||
          event.club?.name.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setEvents(events.filter((e) => e._id !== eventId));
      toast({
        title: 'Success',
        message: 'Event deleted successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        message: 'Failed to delete event',
        type: 'error',
      });
    }
  };

  const handleChangeStatus = async (
    eventId: string,
    newStatus: EventStatus
  ) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      setEvents(
        events.map((e) => (e._id === eventId ? { ...e, status: newStatus } : e))
      );
      toast({
        title: 'Success',
        message: `Event status changed to ${newStatus}`,
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        message: 'Failed to update event status',
        type: 'error',
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Category',
      'Status',
      'Start Date',
      'Location',
      'Registrations',
      'Organizer',
    ];
    const csvData = filteredEvents.map((event) => [
      event._id,
      event.title,
      event.category,
      event.status,
      new Date(event.startDate).toLocaleDateString(),
      event.location,
      `${event.registeredCount}/${event.maxParticipants}`,
      event.organizer.name,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      message: 'Events exported to CSV',
      type: 'success',
    });
  };

  const getStatusBadge = (status: EventStatus) => {
    const variants: Record<
      EventStatus,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: React.ReactNode;
      }
    > = {
      upcoming: {
        variant: 'default',
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      ongoing: {
        variant: 'default',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      completed: {
        variant: 'secondary',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      cancelled: {
        variant: 'destructive',
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };

    return (
      <Badge
        variant={variants[status].variant}
        className="flex items-center w-fit"
      >
        {variants[status].icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category: EventCategory) => {
    return (
      <Badge variant="outline">
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  // Calculate stats
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === 'upcoming').length,
    ongoing: events.filter((e) => e.status === 'ongoing').length,
    completed: events.filter((e) => e.status === 'completed').length,
  };

  return (
    <RoleBasedDashboardLayout
      title="Events Management"
      description="Manage all events across the platform"
      actions={
        <>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Link href="/events/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Events"
          value={stats.total}
          icon={<Calendar className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Upcoming"
          value={stats.upcoming}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Ongoing"
          value={stats.ongoing}
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle className="w-5 h-5 text-gray-500" />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events by title, location, organizer, or club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as EventCategory | 'all')
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="social">Social</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as EventStatus | 'all')
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Events List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Event</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Location</th>
                <th className="text-left p-4 font-medium">Registrations</th>
                <th className="text-left p-4 font-medium">Organizer</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center p-8 text-muted-foreground"
                  >
                    Loading events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center p-8 text-muted-foreground"
                  >
                    No events found
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event._id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        {event.club && (
                          <p className="text-sm text-muted-foreground">
                            {event.club.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{getCategoryBadge(event.category)}</td>
                    <td className="p-4">{getStatusBadge(event.status)}</td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p>{new Date(event.startDate).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          {new Date(event.startDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                        {event.location}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                        {event.registeredCount}/{event.maxParticipants}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{event.organizer.name}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/events/${event._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/events/${event._id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeStatus(event._id, 'upcoming')
                              }
                            >
                              Mark as Upcoming
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeStatus(event._id, 'ongoing')
                              }
                            >
                              Mark as Ongoing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeStatus(event._id, 'completed')
                              }
                            >
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeStatus(event._id, 'cancelled')
                              }
                            >
                              Mark as Cancelled
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteEvent(event._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </RoleBasedDashboardLayout>
  );
}
