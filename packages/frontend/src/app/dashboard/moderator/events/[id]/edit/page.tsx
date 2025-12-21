'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleBasedDashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  moderatorApi,
  type UpdateEventData,
} from '@/services/moderator.service';
import { ROUTES } from '@/lib/constants';

export default function EditEventPage() {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']}>
      <EventEditForm />
    </ProtectedRoute>
  );
}

function EventEditForm() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    capacity: '',
    status: 'published' as 'draft' | 'published' | 'cancelled',
    thumbnail: '',
    tags: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const event = await moderatorApi.events.getById(eventId);

      // Format dates for input fields
      const startDate = new Date(event.startDate).toISOString().slice(0, 16);
      const endDate = new Date(event.endDate).toISOString().slice(0, 16);

      setFormData({
        title: event.title,
        description: event.description,
        startDate,
        endDate,
        venue: event.venue,
        capacity: event.capacity?.toString() || '',
        status: event.status as any,
        thumbnail: event.thumbnail || '',
        tags: event.tags?.join(', ') || '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to fetch event details',
        type: 'error',
      });
      router.push('/dashboard/moderator/events');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    try {
      setSaving(true);

      const updateData: UpdateEventData = {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        venue: formData.venue,
        status: formData.status,
      };

      if (formData.capacity) {
        updateData.capacity = parseInt(formData.capacity);
      }
      if (formData.thumbnail) {
        updateData.thumbnail = formData.thumbnail;
      }
      if (formData.tags) {
        updateData.tags = formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
      }

      await moderatorApi.events.update(eventId, updateData);

      toast({
        title: 'Success',
        message: 'Event updated successfully',
        type: 'success',
      });

      router.push('/dashboard/moderator/events');
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to update event',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/moderator/events">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <p className="text-muted-foreground mt-1">
              Update event details and settings
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter event description"
                rows={6}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={errors.startDate ? 'border-destructive' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={errors.endDate ? 'border-destructive' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue">
                Venue <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="Enter event venue"
                className={errors.venue ? 'border-destructive' : ''}
              />
              {errors.venue && (
                <p className="text-sm text-destructive">{errors.venue}</p>
              )}
            </div>

            {/* Capacity & Status */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Optional)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Maximum participants"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL (Optional)</Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                type="url"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="technology, workshop, networking (comma separated)"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/moderator/events">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
          </Card>
        </form>
      </div>
    </RoleBasedDashboardLayout>
  );
}
