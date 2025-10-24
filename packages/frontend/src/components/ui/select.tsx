'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './label';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  label?: string;
  error?: string;
  hint?: string;
  isLoading?: boolean;
  required?: boolean;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    { className, children, label, error, hint, isLoading, required, ...props },
    ref
  ) => {
    const id = React.useId();
    const hasError = Boolean(error);

    const triggerContent = (
      <div className={cn('relative', isLoading && 'animate-pulse')}>
        <SelectPrimitive.Trigger
          ref={ref}
          id={id}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=open]:border-primary',

            // Default styles
            'border-input bg-background',

            // Error states
            hasError && ['border-destructive focus:ring-destructive'],

            '[&>span]:line-clamp-1',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          disabled={isLoading}
          {...props}
        >
          {children}
          <SelectPrimitive.Icon asChild>
            <div className="flex items-center space-x-1">
              {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
      </div>
    );

    if (label || hint || error) {
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
              {required && (
                <span className="text-destructive ml-1" aria-label="required">
                  *
                </span>
              )}
            </Label>
          )}

          {triggerContent}

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

    return triggerContent;
  }
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Convenience component for simple select usage
interface SimpleSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  isLoading?: boolean;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const SimpleSelect = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SimpleSelectProps
>(
  (
    {
      label,
      error,
      hint,
      placeholder = 'Select an option...',
      isLoading,
      required,
      options,
      value,
      onValueChange,
      className,
      ...props
    },
    ref
  ) => {
    // Validate that no options have empty string values
    React.useEffect(() => {
      const hasEmptyValue = options.some((option) => option.value === '');
      if (hasEmptyValue) {
        console.warn(
          'SimpleSelect: Found options with empty string values. ' +
            'Radix UI Select requires non-empty values. ' +
            'Consider using "all" or another placeholder value instead.'
        );
      }
    }, [options]);

    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          ref={ref}
          label={label}
          error={error}
          hint={hint}
          isLoading={isLoading}
          required={required}
          className={className}
          {...props}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
SimpleSelect.displayName = 'SimpleSelect';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SimpleSelect,
};
