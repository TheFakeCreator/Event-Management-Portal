'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormInput, FormTextarea } from '@/components/ui/form';
import { FormSelect, FormCheckbox } from '@/components/ui/form-controls';
import { LoadingSpinner } from '@/components/ui';
import {
  Users,
  Globe,
  Mail,
  Tag,
  Plus,
  X,
  Save,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { ProtectedRoute } from '@/components/routing';
import { createClubSchema, type CreateClubFormData } from '@/lib/schemas/club';
import { useAuth } from '@/hooks/useAuth';
import { useCreateClub } from '@/hooks/useClubs';

const clubCategories = [
  { value: 'technology', label: 'Technology' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'professional', label: 'Professional' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'other', label: 'Other' },
];

export default function CreateClubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createClub = useCreateClub();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<CreateClubFormData>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: '',
      description: '',
      shortDescription: '',
      website: '',
      socialLinks: {
        twitter: '',
        instagram: '',
        linkedin: '',
        facebook: '',
      },
      category: '',
      contactEmail: user?.email || '',
      membershipRequirements: '',
      tags: [],
      isPublic: true,
      acceptsMembers: true,
    },
  });

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  const handleSubmit = async (data: CreateClubFormData) => {
    createClub.mutate(data, {
      onSuccess: (club: any) => {
        router.push(`${ROUTES.CLUBS}/${club.id}`);
      },
    });
  };

  return (
    <ProtectedRoute requireAuth>
      <DashboardLayout
        title="Create New Club"
        description="Start a new community and bring people together"
        actions={
          <Button variant="outline" asChild>
            <Link href={ROUTES.CLUBS}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clubs
            </Link>
          </Button>
        }
      >
        <div className="max-w-4xl mx-auto">
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit as any)}
              className="space-y-8"
            >
              {/* Basic Information */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="name"
                    label="Club Name"
                    placeholder="Enter club name"
                    required
                  />
                  <FormSelect
                    name="category"
                    label="Category"
                    placeholder="Select a category"
                    options={clubCategories}
                    required
                  />
                </div>
                <div className="mt-4">
                  <FormInput
                    name="shortDescription"
                    label="Short Description"
                    placeholder="Brief description for club cards"
                    description="This will appear in club listings (max 100 characters)"
                    required
                  />
                </div>
                <div className="mt-4">
                  <FormTextarea
                    name="description"
                    label="Full Description"
                    placeholder="Describe your club, its mission, and activities"
                    rows={4}
                    required
                  />
                </div>
              </Card>

              {/* Contact & Social */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Contact & Social Links
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="contactEmail"
                    label="Contact Email"
                    type="email"
                    placeholder="contact@yourclub.com"
                    required
                  />
                  <FormInput
                    name="website"
                    label="Website"
                    type="url"
                    placeholder="https://yourclub.com"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormInput
                    name="socialLinks.twitter"
                    label="Twitter"
                    type="url"
                    placeholder="https://twitter.com/yourclub"
                  />
                  <FormInput
                    name="socialLinks.instagram"
                    label="Instagram"
                    type="url"
                    placeholder="https://instagram.com/yourclub"
                  />
                  <FormInput
                    name="socialLinks.linkedin"
                    label="LinkedIn"
                    type="url"
                    placeholder="https://linkedin.com/company/yourclub"
                  />
                  <FormInput
                    name="socialLinks.facebook"
                    label="Facebook"
                    type="url"
                    placeholder="https://facebook.com/yourclub"
                  />
                </div>
              </Card>

              {/* Membership */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Membership Information
                  </h2>
                </div>
                <div className="space-y-4">
                  <FormTextarea
                    name="membershipRequirements"
                    label="Membership Requirements"
                    placeholder="Describe any requirements or qualifications for joining"
                    rows={3}
                    required
                  />
                  <div className="flex gap-6">
                    <FormCheckbox
                      name="isPublic"
                      label="Public Club"
                      description="Anyone can view club information"
                    />
                    <FormCheckbox
                      name="acceptsMembers"
                      label="Accepting Members"
                      description="Allow new members to join"
                    />
                  </div>
                </div>
              </Card>

              {/* Tags */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Tags</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <FormInput
                      name="tagInput"
                      label=""
                      placeholder="Add tags to help people find your club"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      containerClassName="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      disabled={!tagInput.trim()}
                      className="mt-8"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTag(tag)}
                            className="h-auto p-0 hover:bg-transparent"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {form.formState.errors.tags && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.tags.message}
                    </p>
                  )}
                </div>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={ROUTES.CLUBS}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={createClub.isPending}>
                  {createClub.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
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
            </form>
          </FormProvider>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
