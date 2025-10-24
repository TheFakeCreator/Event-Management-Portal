'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  isLoading?: boolean;
  variant?: 'default' | 'card';
  size?: 'sm' | 'default' | 'lg';
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      label,
      description,
      error,
      hint,
      isLoading,
      variant = 'default',
      size = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    const hasError = Boolean(error);

    const checkboxClasses = cn(
      'peer shrink-0 rounded-sm border border-primary ring-offset-background transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',

      // Size variants
      size === 'sm' && 'h-3 w-3',
      size === 'default' && 'h-4 w-4',
      size === 'lg' && 'h-5 w-5',

      // Error states
      hasError && [
        'border-destructive focus-visible:ring-destructive',
        'data-[state=checked]:bg-destructive data-[state=checked]:border-destructive',
      ],

      className
    );

    const iconSize =
      size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';

    const containerClasses = cn(
      'flex items-start space-x-2',
      variant === 'card' && [
        'rounded-lg border p-4 transition-colors',
        'hover:bg-accent/50',
        'has-[:checked]:bg-accent has-[:checked]:border-primary',
        hasError && 'border-destructive',
      ],
      isLoading && 'animate-pulse'
    );

    const checkbox = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={id}
        className={checkboxClasses}
        disabled={disabled || isLoading}
        aria-invalid={hasError}
        aria-describedby={
          error
            ? `${id}-error`
            : hint
              ? `${id}-hint`
              : description
                ? `${id}-description`
                : undefined
        }
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          {props.checked === 'indeterminate' ? (
            <Minus className={iconSize} />
          ) : (
            <Check className={iconSize} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!label && !description) {
      return checkbox;
    }

    return (
      <div className="space-y-1">
        <div className={containerClasses}>
          {checkbox}

          {(label || description) && (
            <div className="grid gap-1.5 leading-none">
              {label && (
                <Label
                  htmlFor={id}
                  className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    hasError && 'text-destructive',
                    size === 'sm' && 'text-xs',
                    size === 'lg' && 'text-base'
                  )}
                >
                  {label}
                </Label>
              )}
              {description && (
                <p
                  id={`${id}-description`}
                  className={cn(
                    'text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    size === 'sm'
                      ? 'text-xs'
                      : size === 'lg'
                        ? 'text-sm'
                        : 'text-xs'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Help text or error message */}
        {(hint || error) && (
          <div className="space-y-1 ml-6">
            {error && (
              <p
                id={`${id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
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
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// Checkbox Group Component for multiple selections
interface CheckboxGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  label?: string;
  error?: string;
  hint?: string;
  isLoading?: boolean;
  variant?: 'default' | 'card';
  size?: 'sm' | 'default' | 'lg';
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      options,
      value = [],
      onValueChange,
      label,
      error,
      hint,
      isLoading,
      variant = 'default',
      size = 'default',
      orientation = 'vertical',
      className,
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    const hasError = Boolean(error);

    const handleCheckedChange = (optionValue: string, checked: boolean) => {
      if (!onValueChange) return;

      if (checked) {
        onValueChange([...value, optionValue]);
      } else {
        onValueChange(value.filter((v) => v !== optionValue));
      }
    };

    return (
      <div className="space-y-2" ref={ref} {...props}>
        {label && (
          <Label
            className={cn(
              'text-sm font-medium',
              hasError && 'text-destructive'
            )}
          >
            {label}
          </Label>
        )}

        <div
          role="group"
          className={cn(
            'space-y-2',
            orientation === 'horizontal' && 'flex flex-wrap gap-4 space-y-0',
            className
          )}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
        >
          {options.map((option) => (
            <Checkbox
              key={option.value}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) =>
                handleCheckedChange(option.value, checked as boolean)
              }
              label={option.label}
              description={option.description}
              disabled={option.disabled || isLoading}
              variant={variant}
              size={size}
              error={hasError ? ' ' : undefined} // Pass error state but not message
            />
          ))}
        </div>

        {/* Help text or error message */}
        {(hint || error) && (
          <div className="space-y-1">
            {error && (
              <p
                id={`${id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
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
CheckboxGroup.displayName = 'CheckboxGroup';

export { Checkbox, CheckboxGroup };
