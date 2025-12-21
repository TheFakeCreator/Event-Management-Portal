'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { adminApi, type CreateClubData } from '@/services/admin.service';

export default function CreateClubPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <ClubCreateForm />
    </ProtectedRoute>
  );
}

function ClubCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    if (!formData.name.trim()) {
      newErrors.name = 'Club name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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

      const createData: CreateClubData = {
        name: formData.name,
        description: formData.description,
      };

      if (formData.logo) {
        createData.logo = formData.logo;
      }

      await adminApi.clubs.create(createData);

      toast({
        title: 'Success',
        message: 'Club created successfully',
        type: 'success',
      });

      router.push('/dashboard/admin/clubs');
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to create club',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleBasedDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/clubs">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Club</h1>
            <p className="text-muted-foreground mt-1">
              Add a new club to the platform
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            {/* Club Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Club Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter club name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
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
                placeholder="Enter club description"
                rows={6}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL (Optional)</Label>
              <Input
                id="logo"
                name="logo"
                type="url"
                value={formData.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-sm text-muted-foreground">
                Enter a URL to an image for the club logo
              </p>
            </div>

            {/* Logo Preview */}
            {formData.logo && (
              <div className="space-y-2">
                <Label>Logo Preview</Label>
                <div className="border rounded-lg p-4 bg-muted">
                  <img
                    src={formData.logo}
                    alt="Club logo preview"
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      toast({
                        title: 'Invalid Image',
                        message: 'Could not load image from the provided URL',
                        type: 'error',
                      });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/admin/clubs">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Club
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
