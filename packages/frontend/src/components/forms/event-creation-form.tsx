'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MultiStepForm,
  useMultiStepForm,
} from '@/components/ui/multi-step-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SimpleSelect } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  MapPin,
  Users,
  DollarSign,
  Settings,
  Camera,
  Plus,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { validators } from '@/lib/validation';
import { useEventForm } from '@/hooks/use-form-hooks';
import { useLoading } from '@/hooks/use-loading';
import { z } from 'zod';

// Event form data structure
interface EventFormData {
  // Basic Info
  title: string;
  description: string;
  category: string;

  // Location & DateTime
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;

  // Pricing & Capacity
  pricingType: 'free' | 'paid';
  ticketPrice: number;
  currency: string;
  maxAttendees: number;
  allowWaitlist: boolean;

  // Registration Settings
  registrationOpen: boolean;
  registrationDeadline?: Date;
  requireApproval: boolean;

  // Additional Info
  tags: string[];
  images: string[];
  visibility: 'public' | 'private' | 'unlisted';
  coverImage?: string;
  organizingClub?: string;
  collaborators?: string[];
  eventLeads?: string[];
  sponsors?: string[];
}

const eventCategories = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'networking', label: 'Networking' },
  { value: 'social', label: 'Social Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'other', label: 'Other' },
];

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'INR', label: 'INR (₹)' },
];

const visibilityOptions = [
  { value: 'public', label: 'Public - Anyone can see and register' },
  { value: 'private', label: 'Private - Only invited people can see' },
  { value: 'unlisted', label: 'Unlisted - Only people with link can see' },
];

// Step 1: Basic Information
const BasicInfoStep: React.FC<{
  data: Partial<EventFormData>;
  onChange: (data: Partial<EventFormData>) => void;
}> = ({ data, onChange }) => {
  const [newTag, setNewTag] = useState('');
  const [newCollaborator, setNewCollaborator] = useState('');
  const [newLead, setNewLead] = useState('');
  const [newSponsor, setNewSponsor] = useState('');

  const addTag = () => {
    if (newTag.trim() && !data.tags?.includes(newTag.trim())) {
      onChange({
        ...data,
        tags: [...(data.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const addCollaborator = () => {
    if (
      newCollaborator.trim() &&
      !(data.collaborators || []).includes(newCollaborator.trim())
    ) {
      onChange({
        ...data,
        collaborators: [...(data.collaborators || []), newCollaborator.trim()],
      });
      setNewCollaborator('');
    }
  };

  const removeCollaborator = (name: string) => {
    onChange({
      ...data,
      collaborators: (data.collaborators || []).filter((c) => c !== name),
    });
  };

  const addLead = () => {
    if (newLead.trim() && !(data.eventLeads || []).includes(newLead.trim())) {
      onChange({
        ...data,
        eventLeads: [...(data.eventLeads || []), newLead.trim()],
      });
      setNewLead('');
    }
  };

  const removeLead = (name: string) => {
    onChange({
      ...data,
      eventLeads: (data.eventLeads || []).filter((c) => c !== name),
    });
  };

  const addSponsor = () => {
    if (
      newSponsor.trim() &&
      !(data.sponsors || []).includes(newSponsor.trim())
    ) {
      onChange({
        ...data,
        sponsors: [...(data.sponsors || []), newSponsor.trim()],
      });
      setNewSponsor('');
    }
  };

  const removeSponsor = (name: string) => {
    onChange({
      ...data,
      sponsors: (data.sponsors || []).filter((c) => c !== name),
    });
  };

  const removeTag = (tagToRemove: string) => {
    onChange({
      ...data,
      tags: data.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  return (
    <div className="space-y-6">
      <Input
        label="Event Title"
        id="title"
        placeholder="Enter your event title"
        value={data.title || ''}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        required
        hint="Choose a clear, descriptive title that tells people what your event is about"
      />

      <Textarea
        label="Event Description"
        id="description"
        placeholder="Describe your event in detail..."
        value={data.description || ''}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        maxLength={2000}
        showCharacterCount
        required
        hint="Include key details like agenda, speakers, what attendees will learn or gain"
      />

      <SimpleSelect
        label="Event Category"
        options={eventCategories}
        value={data.category || ''}
        onValueChange={(value) => onChange({ ...data, category: value })}
        placeholder="Select a category"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Organizing Club"
          placeholder="Which club is organizing this event?"
          value={data.organizingClub || ''}
          onChange={(e) =>
            onChange({ ...data, organizingClub: e.target.value })
          }
          hint="Optionally associate the event with a club"
        />

        <div>
          <label className="text-sm font-medium">Collaborating Clubs</label>
          <div className="flex space-x-2 mt-2">
            <Input
              placeholder="Add club name"
              value={newCollaborator}
              onChange={(e) => setNewCollaborator(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addCollaborator())
              }
            />
            <Button type="button" onClick={() => addCollaborator()} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {data.collaborators && data.collaborators.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.collaborators.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCollaborator(c)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Event Tags</label>
        <div className="flex space-x-2">
          <Input
            placeholder="Add a tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addTag())
            }
          />
          <Button type="button" onClick={addTag} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Add tags to help people find your event
        </p>
      </div>

      {/* Event leads */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Event Leads</label>
        <div className="flex space-x-2 mt-2">
          <Input
            placeholder="Lead name or email"
            value={newLead}
            onChange={(e) => setNewLead(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addLead())
            }
          />
          <Button type="button" onClick={() => addLead()} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {data.eventLeads && data.eventLeads.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.eventLeads.map((lead) => (
              <Badge
                key={lead}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{lead}</span>
                <button
                  type="button"
                  onClick={() => removeLead(lead)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sponsors */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Sponsors</label>
        <div className="flex space-x-2 mt-2">
          <Input
            placeholder="Sponsor name"
            value={newSponsor}
            onChange={(e) => setNewSponsor(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addSponsor())
            }
          />
          <Button type="button" onClick={() => addSponsor()} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {data.sponsors && data.sponsors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.sponsors.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => removeSponsor(s)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Step 2: Location & DateTime
const LocationDateTimeStep: React.FC<{
  data: Partial<EventFormData>;
  onChange: (data: Partial<EventFormData>) => void;
}> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Venue Name"
          placeholder="e.g., Main Auditorium, Room 101"
          value={data.venue || ''}
          onChange={(e) => onChange({ ...data, venue: e.target.value })}
          required
          leftIcon={<MapPin className="w-4 h-4" />}
        />

        <Input
          label="Street Address"
          placeholder="123 Main Street"
          value={data.address || ''}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="City"
          placeholder="New York"
          value={data.city || ''}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
          required
        />

        <Input
          label="State/Province"
          placeholder="NY"
          value={data.state || ''}
          onChange={(e) => onChange({ ...data, state: e.target.value })}
        />

        <Input
          label="Country"
          placeholder="United States"
          value={data.country || ''}
          onChange={(e) => onChange({ ...data, country: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Event Start</h3>
          <DatePicker
            label="Start Date"
            value={data.startDate}
            onChange={(date) => onChange({ ...data, startDate: date })}
            required
          />
          <Input
            label="Start Time"
            type="time"
            value={data.startTime || ''}
            onChange={(e) => onChange({ ...data, startTime: e.target.value })}
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Event End</h3>
          <DatePicker
            label="End Date"
            value={data.endDate}
            onChange={(date) => onChange({ ...data, endDate: date })}
            required
          />
          <Input
            label="End Time"
            type="time"
            value={data.endTime || ''}
            onChange={(e) => onChange({ ...data, endTime: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
};

// Step 3: Pricing & Capacity
const PricingCapacityStep: React.FC<{
  data: Partial<EventFormData>;
  onChange: (data: Partial<EventFormData>) => void;
}> = ({ data, onChange }) => {
  const isPaid = data.pricingType === 'paid';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-sm font-medium">Pricing</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-colors ${
              data.pricingType === 'free'
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() =>
              onChange({ ...data, pricingType: 'free', ticketPrice: 0 })
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                  {data.pricingType === 'free' && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Free Event</h3>
                  <p className="text-sm text-muted-foreground">
                    No charge for attendees
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              data.pricingType === 'paid'
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() => onChange({ ...data, pricingType: 'paid' })}
          >
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                  {data.pricingType === 'paid' && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Paid Event</h3>
                  <p className="text-sm text-muted-foreground">
                    Charge a ticket price
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isPaid && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ticket Price"
            type="number"
            min="0"
            step="0.01"
            id="ticketPrice"
            value={data.ticketPrice || ''}
            onChange={(e) =>
              onChange({
                ...data,
                ticketPrice: parseFloat(e.target.value) || 0,
              })
            }
            leftIcon={<DollarSign className="w-4 h-4" />}
            required
          />

          <SimpleSelect
            label="Currency"
            options={currencies}
            value={data.currency || 'USD'}
            onValueChange={(value) => onChange({ ...data, currency: value })}
            required
          />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Capacity Settings</h3>

        <Input
          label="Maximum Attendees"
          type="number"
          min="1"
          max="10000"
          id="maxAttendees"
          value={data.maxAttendees || ''}
          onChange={(e) =>
            onChange({ ...data, maxAttendees: parseInt(e.target.value) || 1 })
          }
          leftIcon={<Users className="w-4 h-4" />}
          hint="Set the maximum number of people who can register"
          required
        />

        <Checkbox
          checked={data.allowWaitlist || false}
          onCheckedChange={(checked) =>
            onChange({ ...data, allowWaitlist: checked as boolean })
          }
          label="Enable Waitlist"
          description="Allow people to join a waitlist when the event is full"
        />
      </div>
    </div>
  );
};

// Step 4: Registration Settings
const RegistrationSettingsStep: React.FC<{
  data: Partial<EventFormData>;
  onChange: (data: Partial<EventFormData>) => void;
}> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <Checkbox
        checked={data.registrationOpen !== false}
        onCheckedChange={(checked) =>
          onChange({ ...data, registrationOpen: checked as boolean })
        }
        label="Registration Open"
        description="Allow people to register for this event"
      />

      <DatePicker
        label="Registration Deadline (Optional)"
        value={data.registrationDeadline}
        onChange={(date) => onChange({ ...data, registrationDeadline: date })}
        hint="Set a deadline for registration. Leave empty for no deadline."
      />

      <Checkbox
        checked={data.requireApproval || false}
        onCheckedChange={(checked) =>
          onChange({ ...data, requireApproval: checked as boolean })
        }
        label="Require Approval"
        description="Manually approve each registration before confirming attendance"
      />

      <SimpleSelect
        label="Event Visibility"
        options={visibilityOptions}
        value={data.visibility || 'public'}
        onValueChange={(value: string) =>
          onChange({
            ...data,
            visibility: value as 'public' | 'private' | 'unlisted',
          })
        }
        hint="Control who can see and access your event"
        required
      />
    </div>
  );
};

// Step 5: Images & Review
const ImagesReviewStep: React.FC<{
  data: Partial<EventFormData>;
  onChange: (data: Partial<EventFormData>) => void;
}> = ({ data, onChange }) => {
  const handleImageUpload = (files: UploadedFile[]) => {
    const uploadedUrls = files
      .filter((file) => file.status === 'uploaded' && file.url)
      .map((file) => file.url!);
    onChange({ ...data, images: [...(data.images || []), ...uploadedUrls] });
  };

  const handleCoverUpload = (files: UploadedFile[]) => {
    const first = files.find((f) => f.status === 'uploaded' && f.url);
    if (first && first.url) {
      onChange({ ...data, coverImage: first.url });
    }
  };

  const removeImage = (urlToRemove: string) => {
    onChange({
      ...data,
      images: data.images?.filter((url) => url !== urlToRemove) || [],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Event Images</h3>
        <FileUpload
          onFilesChange={handleImageUpload}
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
          multiple
          maxFiles={5}
          maxSize={5 * 1024 * 1024} // 5MB
        />

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Cover Image</h4>
          <Input
            label="Cover Image URL"
            id="coverImage"
            placeholder="https://example.com/image.jpg"
            value={data.coverImage || ''}
            onChange={(e) => onChange({ ...data, coverImage: e.target.value })}
          />

          <div className="mt-3">
            <FileUpload
              onFilesChange={handleCoverUpload}
              multiple={false}
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
              maxFiles={1}
              maxSize={5 * 1024 * 1024}
            />
            {data.coverImage && (
              <div className="mt-3">
                <img
                  src={data.coverImage}
                  alt="Cover preview"
                  className="w-full h-40 object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        {data.images && data.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {data.images.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Event image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Review Your Event</h3>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="font-medium">{data.title || 'Event Title'}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {data.description || 'Event description will appear here'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    {data.startDate
                      ? data.startDate.toLocaleDateString()
                      : 'Start date'}{' '}
                    -
                    {data.endDate
                      ? data.endDate.toLocaleDateString()
                      : 'End date'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {data.venue || 'Venue'}, {data.city || 'City'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Max {data.maxAttendees || 0} attendees</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {data.pricingType === 'free'
                      ? 'Free'
                      : `${data.currency || 'USD'} ${data.ticketPrice || 0}`}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span className="capitalize">
                    {data.visibility || 'public'} event
                  </span>
                </div>

                {data.tags && data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const EventCreationForm: React.FC = () => {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { loading: isSubmitting, startLoading, stopLoading } = useLoading();

  const {
    currentStep,
    formData,
    nextStep,
    prevStep,
    goToStep,
    updateStepData,
    resetForm,
  } = useMultiStepForm([
    {
      id: 'basic',
      title: 'Basic Info',
      description: 'Event title, description, and category',
      component: <div>Basic Info Step</div>,
    },
    {
      id: 'location',
      title: 'Location & Time',
      description: 'Where and when your event takes place',
      component: <div>Location Step</div>,
    },
    {
      id: 'pricing',
      title: 'Pricing & Capacity',
      description: 'Ticket pricing and attendee limits',
      component: <div>Pricing Step</div>,
    },
    {
      id: 'registration',
      title: 'Registration',
      description: 'Registration settings and visibility',
      component: <div>Registration Step</div>,
    },
    {
      id: 'review',
      title: 'Images & Review',
      description: 'Upload images and review your event',
      component: <div>Review Step</div>,
    },
  ]);

  const handleStepChange = (data: Partial<EventFormData>) => {
    updateStepData(steps[currentStep].id, data);
  };

  // Build a merged view of all form data for review display
  const mergedFormDataView: Partial<EventFormData> = Object.values(
    formData
  ).reduce((acc, stepData) => ({ ...acc, ...stepData }), {});

  const handleReviewChange = (data: Partial<EventFormData>) => {
    // Persist review-related changes (images, coverImage) under the 'review' step.
    // Defer the state update to avoid "setState() during rendering" when this
    // handler is invoked synchronously from a child component (e.g. FileUpload)
    // — schedule on next microtask.
    Promise.resolve().then(() => updateStepData('review', data));
  };

  const validateStep = (stepId: string): boolean => {
    const data = formData[stepId] as Partial<EventFormData>;

    switch (stepId) {
      case 'basic':
        return !!(data?.title && data?.description && data?.category);
      case 'location':
        return !!(
          data?.venue &&
          data?.address &&
          data?.city &&
          data?.country &&
          data?.startDate &&
          data?.endDate &&
          data?.startTime &&
          data?.endTime
        );
      case 'pricing':
        return !!(
          data?.pricingType &&
          data?.maxAttendees &&
          data?.maxAttendees > 0
        );
      case 'registration':
        // Visibility defaults to 'public' when not explicitly set in the UI.
        // Treat an untouched registration step as valid so the user can proceed
        // without having to interact with the select if they accept the default.
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    startLoading();

    try {
      // Combine all form data into a single object
      const merged = Object.values(formData).reduce(
        (acc, stepData) => ({ ...acc, ...stepData }),
        {}
      );

      // Build the payload to match the validation schema
      const payload = {
        title: merged.title,
        description: merged.description,
        category: merged.category,
        location: {
          venue: merged.venue,
          address: merged.address,
          city: merged.city,
          state: merged.state,
          country: merged.country,
          zipCode: merged.zipCode || '',
        },
        dateTime: {
          startDate: merged.startDate,
          endDate: merged.endDate,
          startTime: merged.startTime,
          endTime: merged.endTime,
        },
        pricing: {
          type: merged.pricingType || 'free',
          amount: Number(merged.ticketPrice) || 0,
          currency: merged.currency || 'USD',
        },
        capacity: {
          maxAttendees: Number(merged.maxAttendees) || 0,
          allowWaitlist: Boolean(merged.allowWaitlist),
        },
        registration: {
          isOpen: Boolean(merged.registrationOpen),
          deadline: merged.registrationDeadline || undefined,
          requireApproval: Boolean(merged.requireApproval),
        },
        visibility: merged.visibility || 'public',
        tags: merged.tags || [],
        images: merged.images || [],
        // extra fields (coverImage, organizingClub, collaborators, leads, sponsors)
        coverImage: merged.coverImage,
        organizingClub: merged.organizingClub,
        collaborators: merged.collaborators || [],
        eventLeads: merged.eventLeads || [],
        sponsors: merged.sponsors || [],
      };

      // Validate payload with the Zod schema. Use validators helper to get structured errors
      const validation = await validators.event.validateAsync(payload);
      if (!validation.success) {
        // Pick first error path and map to a step
        const errors = validation.errors ?? {};
        const firstPath = Object.keys(errors)[0];
        const pathParts = firstPath ? firstPath.split('.') : [''];

        // map root keys to step ids
        const mapRootToStepId = (root: string) => {
          if (['title', 'description', 'category'].includes(root))
            return 'basic';
          if (
            [
              'location',
              'dateTime',
              'startDate',
              'endDate',
              'startTime',
              'endTime',
            ].includes(root)
          )
            return 'location';
          if (
            [
              'pricing',
              'amount',
              'currency',
              'type',
              'capacity',
              'maxAttendees',
              'allowWaitlist',
            ].includes(root)
          )
            return 'pricing';
          if (
            [
              'registration',
              'visibility',
              'isOpen',
              'deadline',
              'requireApproval',
            ].includes(root)
          )
            return 'registration';
          if (['tags', 'images'].includes(root)) return 'review';
          return 'basic';
        };

        const targetStepId = mapRootToStepId(pathParts[0]);
        const stepIndex = steps.findIndex((s) => s.id === targetStepId);
        if (stepIndex >= 0) {
          goToStep(stepIndex);
        }

        // Attempt to focus the specific field by id or name
        setTimeout(() => {
          const fieldName = pathParts[pathParts.length - 1];
          const el =
            document.getElementById(fieldName) ||
            document.querySelector(`[name="${fieldName}"]`);
          if (el && (el as HTMLElement).scrollIntoView) {
            (el as HTMLElement).scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            try {
              (el as HTMLElement).focus();
            } catch (e) {
              // ignore
            }
          }
        }, 250);

        toastError(
          'Validation error',
          Object.values(errors)[0] || 'Please review the form fields'
        );
        return;
      }

      // At this point validation passed; proceed to submit to API
      console.log('Creating event:', payload);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      toastSuccess(
        'Event Created!',
        'Your event has been successfully created.'
      );
      router.push('/dashboard/events');
    } catch (error) {
      toastError('Error', 'Failed to create event. Please try again.');
    } finally {
      stopLoading();
    }
  };

  const steps = [
    {
      id: 'basic',
      title: 'Basic Info',
      description: 'Event title, description, and category',
      component: (
        <BasicInfoStep
          data={formData['basic'] || {}}
          onChange={handleStepChange}
        />
      ),
    },
    {
      id: 'location',
      title: 'Location & Time',
      description: 'Where and when your event takes place',
      component: (
        <LocationDateTimeStep
          data={formData['location'] || {}}
          onChange={handleStepChange}
        />
      ),
    },
    {
      id: 'pricing',
      title: 'Pricing & Capacity',
      description: 'Ticket pricing and attendee limits',
      component: (
        <PricingCapacityStep
          data={formData['pricing'] || {}}
          onChange={handleStepChange}
        />
      ),
    },
    {
      id: 'registration',
      title: 'Registration',
      description: 'Registration settings and visibility',
      component: (
        <RegistrationSettingsStep
          data={formData['registration'] || {}}
          onChange={handleStepChange}
        />
      ),
    },
    {
      id: 'review',
      title: 'Images & Review',
      description: 'Upload images and review your event',
      component: (
        <ImagesReviewStep
          // Pass a merged view (all steps) so the review shows the entered info
          data={mergedFormDataView}
          // But persist image/cover changes into the 'review' step
          onChange={handleReviewChange}
        />
      ),
    },
  ];

  const stepValidators = Object.fromEntries(
    steps.map((step) => [step.id, () => validateStep(step.id)])
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create and publish your event
        </p>
      </div>

      <MultiStepForm
        steps={steps}
        currentStep={currentStep}
        onStepChange={goToStep}
        onComplete={handleComplete}
        onCancel={() => router.push('/dashboard/events')}
        stepValidators={stepValidators}
        onStepSave={updateStepData}
        isLoading={isSubmitting}
        canGoBack={true}
        showProgressBar={true}
        showStepNumbers={true}
      />
    </div>
  );
};
