'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  isLoading?: boolean;
  variant?: 'default' | 'filled';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  maxLength?: number;
  showCharacterCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      isLoading,
      variant = 'default',
      resize = 'vertical',
      maxLength,
      showCharacterCount = false,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const id = React.useId();
    const hasError = Boolean(error);

    const currentLength = typeof value === 'string' ? value.length : 0;
    const showCount = showCharacterCount && (maxLength || currentLength > 0);

    const textareaClasses = cn(
      // Base styles
      'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',

      // Variant styles
      variant === 'default' && [
        'border-input bg-background',
        isFocused && !hasError && 'border-primary',
      ],
      variant === 'filled' && [
        'border-transparent bg-muted',
        isFocused && 'bg-background border-primary',
      ],

      // Error states
      hasError && ['border-destructive focus-visible:ring-destructive'],

      // Resize options
      resize === 'none' && 'resize-none',
      resize === 'vertical' && 'resize-y',
      resize === 'horizontal' && 'resize-x',
      resize === 'both' && 'resize',

      className
    );

    const containerClasses = cn(
      'relative w-full',
      isLoading && 'animate-pulse'
    );

    return (
      <div className="space-y-1">
        {label && (
          <Label
            htmlFor={id}
            className={cn(
              'text-sm font-medium',
              hasError && 'text-destructive'
            )}
          >
            {label}
            {props.required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
        )}

        <div className={containerClasses}>
          <textarea
            id={id}
            className={textareaClasses}
            ref={ref}
            disabled={disabled || isLoading}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            maxLength={maxLength}
            value={value}
            {...props}
          />

          {/* Error indicator */}
          {hasError && (
            <div className="absolute right-3 top-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>

        {/* Character count */}
        {showCount && (
          <div className="flex justify-end">
            <span
              className={cn(
                'text-xs',
                maxLength && currentLength > maxLength * 0.9
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              {maxLength ? `${currentLength}/${maxLength}` : currentLength}
            </span>
          </div>
        )}

        {/* Help text or error message */}
        {(hint || error) && (
          <div className="space-y-1">
            {error && (
              <p
                id={`${id}-error`}
                className="text-sm text-destructive flex items-center space-x-1"
                role="alert"
              >
                <span>{error}</span>
              </p>
            )}
            {hint && !error && (
              <p id={`${id}-hint`} className="text-sm text-muted-foreground">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
