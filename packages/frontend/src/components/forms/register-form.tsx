'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRegisterForm } from '@/hooks/use-form-hooks';

interface RegisterFormProps {
  onSubmit?: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    agreeToTerms: boolean;
  }) => Promise<void>;
  className?: string;
}

export function RegisterForm({ onSubmit, className }: RegisterFormProps) {
  const { success, error } = useToast();
  const { values, errors, isSubmitting, setFieldValue, handleSubmit, reset } =
    useRegisterForm();

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        success(
          'Registration successful!',
          'Welcome! Please check your email to verify your account.'
        );
        reset();
      } else {
        // Default behavior - just log for demo
        console.log('Registration attempt:', data);
        success('Registration successful!', `Welcome, ${data.firstName}!`);
        reset();
      }
    } catch (err) {
      error(
        'Registration failed',
        err instanceof Error ? err.message : 'Please try again'
      );
    }
  });

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in your details to create a new account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              value={values.firstName}
              onChange={setFieldValue('firstName')}
              error={errors.firstName}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Last Name"
              placeholder="Doe"
              value={values.lastName}
              onChange={setFieldValue('lastName')}
              error={errors.lastName}
              required
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="john.doe@example.com"
            value={values.email}
            onChange={setFieldValue('email')}
            error={errors.email}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={values.phoneNumber}
            onChange={setFieldValue('phoneNumber')}
            error={errors.phoneNumber}
            hint="Optional - for account recovery"
            disabled={isSubmitting}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Choose a strong password"
            value={values.password}
            onChange={setFieldValue('password')}
            error={errors.password}
            hint="At least 8 characters with uppercase, lowercase, and numbers"
            required
            disabled={isSubmitting}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={values.confirmPassword}
            onChange={setFieldValue('confirmPassword')}
            error={errors.confirmPassword}
            required
            disabled={isSubmitting}
          />

          <Checkbox
            checked={values.agreeToTerms}
            onChange={setFieldValue('agreeToTerms')}
            label="I agree to the Terms of Service and Privacy Policy"
            error={errors.agreeToTerms}
            required
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            loadingText="Creating Account..."
          >
            Create Account
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Button variant="link" size="sm" className="p-0">
            Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Demo usage component
export function RegisterFormDemo() {
  const handleRegister = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate validation
    if (data.email === 'existing@example.com') {
      throw new Error('Email already exists');
    }

    if (!data.agreeToTerms) {
      throw new Error('You must agree to the terms of service');
    }

    // Success
    return;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <RegisterForm onSubmit={handleRegister} />
      </div>
    </div>
  );
}
