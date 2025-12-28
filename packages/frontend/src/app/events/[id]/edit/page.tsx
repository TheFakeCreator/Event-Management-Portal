'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  capacity: number;
  registrationDeadline: string;
  visibility: 'public' | 'private' | 'club-only';
  thumbnail?: string;
}

export default function EditEventPage() {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']}>
      <EditEvent />
    </ProtectedRoute>
  );
}

function EditEvent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    capacity: 0,
    registrationDeadline: '',
    visibility: 'public',
  });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/v1/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event');

      const data = await response.json();
      const event = data.data;

      setFormData({
        title: event.title,
        description: event.description,
        startDate: new Date(event.startDate).toISOString().slice(0, 16),
        endDate: new Date(event.endDate).toISOString().slice(0, 16),
        venue: event.venue || '',
        capacity: event.capacity || 0,
        registrationDeadline: event.registrationDeadline
          ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
          : '',
        visibility: event.visibility || 'public',
        thumbnail: event.thumbnail,
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Error',
        message: 'Failed to load event details',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/v1/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update event');

      toast({
        title: 'Success',
        message: 'Event updated successfully',
        type: 'success',
      });

      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        message: 'Failed to update event',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setDeleting(true);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/v1/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      toast({
        title: 'Success',
        message: 'Event deleted successfully',
        type: 'success',
      });

      router.push(ROUTES.EVENTS);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        message: 'Failed to delete event',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground mt-2">
          Update event details and settings
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Event Title *
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event"
              rows={5}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium mb-2"
              >
                Start Date & Time *
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium mb-2"
              >
                End Date & Time *
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Venue and Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="venue" className="block text-sm font-medium mb-2">
                Venue *
              </label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="Event location"
                required
              />
            </div>
            <div>
              <label
                htmlFor="capacity"
                className="block text-sm font-medium mb-2"
              >
                Capacity
              </label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Maximum attendees"
                min="0"
              />
            </div>
          </div>

          {/* Registration Deadline */}
          <div>
            <label
              htmlFor="registrationDeadline"
              className="block text-sm font-medium mb-2"
            >
              Registration Deadline
            </label>
            <Input
              id="registrationDeadline"
              name="registrationDeadline"
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={handleChange}
            />
          </div>

          {/* Visibility */}
          <div>
            <label
              htmlFor="visibility"
              className="block text-sm font-medium mb-2"
            >
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="club-only">Club Only</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Event
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving || deleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
