'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleBasedDashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Users,
  MapPin,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import {
  moderatorApi,
  type ModeratorEvent,
} from '@/services/moderator.service';
import { ROUTES } from '@/lib/constants';

export default function ModeratorEventsPage() {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']}>
      <EventsManagement />
    </ProtectedRoute>
  );
}

function EventsManagement() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [events, setEvents] = useState<ModeratorEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ModeratorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await moderatorApi.events.getAll();
      setEvents(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to fetch events',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await moderatorApi.events.delete(eventId);
      toast({
        title: 'Success',
        message: 'Event deleted successfully',
        type: 'success',
      });
      setEvents(events.filter((e) => e._id !== eventId));
      setDeleteConfirm(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to delete event',
        type: 'error',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline' as any;
    }
  };

  const isEventPast = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <RoleBasedDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </RoleBasedDashboardLayout>
    );
  }

  return (
    <RoleBasedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Event Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage events for your clubs
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTES.CREATE_EVENT}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('published')}
              >
                Published
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelled
              </Button>
            </div>
          </div>
        </Card>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first event to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button asChild>
                  <Link href={ROUTES.CREATE_EVENT}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event._id} className="overflow-hidden">
                {/* Event Thumbnail */}
                {event.thumbnail && (
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={event.thumbnail}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    {isEventPast(event.endDate) && (
                      <Badge
                        className="absolute top-2 right-2"
                        variant="secondary"
                      >
                        Past
                      </Badge>
                    )}
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusBadgeVariant(event.status)}>
                      {event.status}
                    </Badge>
                    {event.clubId && (
                      <span className="text-xs text-muted-foreground">
                        {event.clubId.name}
                      </span>
                    )}
                  </div>

                  {/* Event Title */}
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Event Info */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(event.startDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {event.registrationCount || 0} / {event.capacity}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/events/${event._id}`}>View</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={`/dashboard/moderator/events/${event._id}/edit`}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    {deleteConfirm === event._id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEvent(event._id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(event._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleBasedDashboardLayout>
  );
}
