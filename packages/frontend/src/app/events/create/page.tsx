'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/routing';
import { Button, Card, FormInput, FormTextarea } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/radix-select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  createEventSchema,
  type CreateEventData,
  EVENT_CATEGORIES,
} from '@/lib/schemas';
import { ROUTES } from '@/lib/constants';
import { useCreateEvent } from '@/hooks/useEvents';
import { Calendar, Clock, MapPin, Users, Plus, ListTodo } from 'lucide-react';
import Link from 'next/link';

export default function CreateEventPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const createEvent = useCreateEvent();

  const form = useForm<CreateEventData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      isPublic: true,
      requiresApproval: false,
      duration: 2,
      cost: {
        currency: 'USD',
      },
    },
  });

  const onSubmit = async (data: CreateEventData) => {
    createEvent.mutate(data, {
      onSuccess: (event: any) => {
        router.push(`${ROUTES.EVENTS}/${event.id}`);
      },
    });
  };

  const steps = [
    { title: 'Basic Info', icon: Calendar },
    { title: 'Details', icon: ListTodo },
    { title: 'Advanced', icon: Users },
  ];

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormInput
              name="title"
              label="Event Title"
              placeholder="Enter event title"
              required
            />

            <FormTextarea
              name="description"
              label="Short Description"
              placeholder="Brief description of your event"
              rows={3}
              required
              description="This will be shown in event listings"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  onValueChange={(value) => form.setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>

              <FormInput
                name="location"
                label="Location"
                placeholder="Enter event location"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput name="date" label="Event Date" type="date" required />

              <FormInput name="time" label="Start Time" type="time" required />

              <FormInput
                name="duration"
                label="Duration (hours)"
                type="number"
                min="1"
                max="24"
                required
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <FormTextarea
              name="longDescription"
              label="Detailed Description"
              placeholder="Provide detailed information about the event"
              rows={6}
              description="Include what participants can expect, learning outcomes, etc."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="maxParticipants"
                label="Maximum Participants"
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
              />

              <FormInput
                name="registrationDeadline"
                label="Registration Deadline"
                type="date"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Event Settings */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Event Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={form.watch('isPublic')}
                    onCheckedChange={(checked: boolean) =>
                      form.setValue('isPublic', checked)
                    }
                  />
                  <Label htmlFor="isPublic">Make this event public</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresApproval"
                    checked={form.watch('requiresApproval')}
                    onCheckedChange={(checked: boolean) =>
                      form.setValue('requiresApproval', checked)
                    }
                  />
                  <Label htmlFor="requiresApproval">
                    Require approval for registration
                  </Label>
                </div>
              </div>
            </Card>

            {/* Cost Information */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Cost Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  name="cost.amount"
                  label="Cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={form.watch('cost.currency')}
                    onValueChange={(value) =>
                      form.setValue('cost.currency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FormInput
                  name="cost.description"
                  label="Cost Description"
                  placeholder="What does the cost cover?"
                />
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="contact.email"
                  label="Contact Email"
                  type="email"
                  placeholder="contact@example.com"
                />

                <FormInput
                  name="contact.phone"
                  label="Contact Phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />

                <FormInput
                  name="contact.website"
                  label="Website"
                  type="url"
                  placeholder="https://example.com"
                  className="md:col-span-2"
                />
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requireAuth>
      <DashboardLayout
        title="Create Event"
        description="Create a new event for your community"
        actions={
          <Button variant="outline" asChild>
            <Link href={ROUTES.EVENTS}>Cancel</Link>
          </Button>
        }
      >
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="max-w-4xl mx-auto"
          >
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={index} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isCurrent
                            ? 'border-primary text-primary'
                            : 'border-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-0.5 mx-4 ${
                          isCompleted ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <Card className="p-6">{renderStepContent()}</Card>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={createEvent.isPending}>
                    {createEvent.isPending ? 'Creating...' : 'Create Event'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
