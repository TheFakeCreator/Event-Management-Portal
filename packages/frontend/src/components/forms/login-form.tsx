'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useLoginForm } from '@/hooks/use-form-hooks';

interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => Promise<void>;
  className?: string;
}

export function LoginForm({ onSubmit, className }: LoginFormProps) {
  const { success, error } = useToast();
  const { values, errors, isSubmitting, setFieldValue, handleSubmit, reset } =
    useLoginForm();

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        success('Login successful!', 'Welcome back!');
        reset();
      } else {
        // Default behavior - just log for demo
        console.log('Login attempt:', data);
        success('Login successful!', `Welcome back, ${data.email}!`);
        reset();
      }
    } catch (err) {
      error(
        'Login failed',
        err instanceof Error ? err.message : 'Please check your credentials'
      );
    }
  });

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to sign in to your account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={values.email}
            onChange={setFieldValue('email')}
            error={errors.email}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={values.password}
            onChange={setFieldValue('password')}
            error={errors.password}
            required
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between">
            <Checkbox label="Remember me" />
            <Button variant="link" size="sm" type="button">
              Forgot password?
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            loadingText="Signing in..."
          >
            Sign in
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Button variant="link" size="sm" className="p-0">
            Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Demo usage component
export function LoginFormDemo() {
  const handleLogin = async (data: { email: string; password: string }) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (data.email === 'demo@example.com' && data.password === 'password') {
      return; // Success
    }
    throw new Error('Invalid credentials');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
