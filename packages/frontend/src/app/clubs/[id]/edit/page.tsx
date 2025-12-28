'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';

interface ClubFormData {
  name: string;
  description: string;
  category: string;
  logo?: string;
  contactEmail: string;
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export default function EditClubPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <EditClub />
    </ProtectedRoute>
  );
}

function EditClub() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const clubId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    description: '',
    category: 'academic',
    contactEmail: '',
    socialLinks: {},
  });

  useEffect(() => {
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/clubs/${clubId}`);
      if (!response.ok) throw new Error('Failed to fetch club');

      const data = await response.json();
      const club = data.data;

      setFormData({
        name: club.name,
        description: club.description,
        category: club.category || 'academic',
        logo: club.logo,
        contactEmail: club.contactEmail || '',
        socialLinks: club.socialLinks || {},
      });
    } catch (error) {
      console.error('Error fetching club:', error);
      toast({
        title: 'Error',
        message: 'Failed to load club details',
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

      const response = await fetch(`/api/v1/clubs/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update club');

      toast({
        title: 'Success',
        message: 'Club updated successfully',
        type: 'success',
      });

      router.push(`/clubs/${clubId}`);
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: 'Error',
        message: 'Failed to update club',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this club? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(`/api/v1/clubs/${clubId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete club');

      toast({
        title: 'Success',
        message: 'Club deleted successfully',
        type: 'success',
      });

      router.push('/clubs');
    } catch (error) {
      console.error('Error deleting club:', error);
      toast({
        title: 'Error',
        message: 'Failed to delete club',
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

    if (name.startsWith('social.')) {
      const socialField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading club details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/clubs/${clubId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Club
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Club</h1>
        <p className="text-muted-foreground mt-2">
          Update club details and settings
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Club Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Club Name *
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter club name"
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
              placeholder="Describe the club's mission and activities"
              rows={5}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium mb-2"
            >
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="academic">Academic</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="technical">Technical</option>
              <option value="social">Social Service</option>
              <option value="arts">Arts & Music</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Contact Email */}
          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium mb-2"
            >
              Contact Email *
            </label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="club@example.com"
              required
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium mb-2">
              Club Logo
            </label>
            {formData.logo && (
              <div className="mb-4">
                <img
                  src={formData.logo}
                  alt="Club logo"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                {formData.logo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Recommended size: 200x200px
              </span>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Social Links (Optional)</h3>

            <div>
              <label
                htmlFor="social.website"
                className="block text-sm font-medium mb-2"
              >
                Website
              </label>
              <Input
                id="social.website"
                name="social.website"
                type="url"
                value={formData.socialLinks?.website || ''}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="social.facebook"
                  className="block text-sm font-medium mb-2"
                >
                  Facebook
                </label>
                <Input
                  id="social.facebook"
                  name="social.facebook"
                  type="url"
                  value={formData.socialLinks?.facebook || ''}
                  onChange={handleChange}
                  placeholder="Facebook URL"
                />
              </div>

              <div>
                <label
                  htmlFor="social.twitter"
                  className="block text-sm font-medium mb-2"
                >
                  Twitter
                </label>
                <Input
                  id="social.twitter"
                  name="social.twitter"
                  type="url"
                  value={formData.socialLinks?.twitter || ''}
                  onChange={handleChange}
                  placeholder="Twitter URL"
                />
              </div>

              <div>
                <label
                  htmlFor="social.instagram"
                  className="block text-sm font-medium mb-2"
                >
                  Instagram
                </label>
                <Input
                  id="social.instagram"
                  name="social.instagram"
                  type="url"
                  value={formData.socialLinks?.instagram || ''}
                  onChange={handleChange}
                  placeholder="Instagram URL"
                />
              </div>
            </div>
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
                  Delete Club
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
