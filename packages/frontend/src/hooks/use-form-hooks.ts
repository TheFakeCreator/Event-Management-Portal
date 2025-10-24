'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
  changePasswordSchema,
  eventSchema,
  clubSchema,
  recruitmentSchema,
  announcementSchema,
  contactSchema,
  searchSchema,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
  type ProfileFormData,
  type ChangePasswordFormData,
  type EventFormData,
  type ClubFormData,
  type RecruitmentFormData,
  type AnnouncementFormData,
  type ContactFormData,
  type SearchFormData,
} from '@/lib/validation';

// Generic form state hook with validation
export function useFormState<T>(
  initialValues: T,
  validationSchema?: z.ZodSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const setFieldValue = useCallback(
    (field: keyof T) => (value: any) => {
      setValue(field, value);
    },
    [setValue]
  );

  const validate = useCallback(() => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          formattedErrors[path] = err.message;
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  }, [values, validationSchema]);

  const handleSubmit = useCallback(
    (onSubmit: (data: T) => Promise<void> | void) =>
      async (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsSubmitting(true);

        try {
          if (validate()) {
            await onSubmit(values);
          }
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      },
    [validate, values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setFieldValue,
    validate,
    handleSubmit,
    reset,
    getFieldProps: (field: keyof T) => ({
      value: values[field],
      onChange: setFieldValue(field),
      error: errors[field as string],
    }),
  };
}

// Specific form hooks
export function useLoginForm() {
  return useFormState<LoginFormData>(
    {
      email: '',
      password: '',
    },
    loginSchema
  );
}

export function useRegisterForm() {
  return useFormState<RegisterFormData>(
    {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      agreeToTerms: false,
    },
    registerSchema
  );
}

export function useForgotPasswordForm() {
  return useFormState<ForgotPasswordFormData>(
    {
      email: '',
    },
    forgotPasswordSchema
  );
}

export function useResetPasswordForm() {
  return useFormState<ResetPasswordFormData>(
    {
      password: '',
      confirmPassword: '',
    },
    resetPasswordSchema
  );
}

export function useProfileForm() {
  return useFormState<ProfileFormData>(
    {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      bio: '',
      website: '',
      location: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        github: '',
      },
    },
    profileSchema
  );
}

export function useChangePasswordForm() {
  return useFormState<ChangePasswordFormData>(
    {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    changePasswordSchema
  );
}

export function useEventForm() {
  // Use the exact type that Zod expects for input
  const initialValues: z.input<typeof eventSchema> = {
    title: '',
    description: '',
    category: '',
    location: {
      venue: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    dateTime: {
      startDate: new Date(),
      endDate: new Date(),
      startTime: '',
      endTime: '',
    },
    pricing: {
      type: 'free' as const,
      amount: 0,
      // currency is optional in input, will default to USD
    },
    capacity: {
      maxAttendees: 50,
      // allowWaitlist is optional in input, will default to false
    },
    registration: {
      // isOpen is optional in input, will default to true
      // deadline is optional
      // requireApproval is optional in input, will default to false
    },
    visibility: 'public' as const,
    // tags and images are optional
  };

  return useFormState(initialValues, eventSchema);
}

export function useClubForm() {
  const initialValues: z.input<typeof clubSchema> = {
    name: '',
    description: '',
    category: '',
    mission: '',
    location: '',
    website: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
    },
    contactInfo: {
      email: '',
      phone: '',
    },
    membershipInfo: {
      // isOpen, requireApplication default to true/false respectively
      membershipFee: 0,
    },
    tags: [],
    logo: '',
  };

  return useFormState(initialValues, clubSchema);
}

export function useRecruitmentForm() {
  const initialValues: z.input<typeof recruitmentSchema> = {
    title: '',
    description: '',
    positions: [
      {
        title: '',
        description: '',
        requirements: [],
        skills: [],
        timeCommitment: '',
      },
    ],
    applicationDeadline: new Date(),
    contactEmail: '',
    applicationProcess: {
      steps: ['Submit application'],
      requirements: [],
      // interviewRequired defaults to false
    },
    eligibility: {
      // experienceRequired defaults to false
    },
    benefits: [],
    // isActive defaults to true
  };

  return useFormState(initialValues, recruitmentSchema);
}

export function useAnnouncementForm() {
  const initialValues: z.input<typeof announcementSchema> = {
    title: '',
    content: '',
    type: 'general' as const,
    targetAudience: 'all' as const,
    priority: 'medium' as const,
    attachments: [],
    // isPinned defaults to false
    // sendNotification defaults to true
  };

  return useFormState(initialValues, announcementSchema);
}

export function useContactForm() {
  return useFormState<ContactFormData>(
    {
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general' as const,
    },
    contactSchema
  );
}

export function useSearchForm() {
  const initialValues: z.input<typeof searchSchema> = {
    query: '',
    category: '',
    location: '',
    // sortBy defaults to 'date'
    // sortOrder defaults to 'asc'
  };

  return useFormState(initialValues, searchSchema);
}

// Hook for form submission with loading state
export function useFormSubmission<T>(
  onSubmit: (data: T) => Promise<void> | void,
  onSuccess?: () => void,
  onError?: (error: Error) => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: T) => {
    try {
      setIsLoading(true);
      setError(null);
      await onSubmit(data);
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
