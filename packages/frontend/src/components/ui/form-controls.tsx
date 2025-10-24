'use client';

import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/radix-select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormSelectProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  containerClassName?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FormSelect = forwardRef<HTMLDivElement, FormSelectProps>(
  (
    {
      name,
      label,
      description,
      placeholder,
      options,
      containerClassName,
      error,
      required,
      disabled,
    },
    ref
  ) => {
    const form = useFormContext();
    const fieldError = error || form?.formState?.errors?.[name]?.message;

    return (
      <div className={cn('space-y-2', containerClassName)} ref={ref}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Controller
          name={name}
          control={form?.control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                className={cn(
                  fieldError && 'border-red-500 focus:ring-red-500'
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {description && !fieldError && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {fieldError && (
          <p className="text-sm text-red-500">{fieldError as string}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export interface FormCheckboxProps {
  name: string;
  label?: string;
  description?: string;
  containerClassName?: string;
  error?: string;
  disabled?: boolean;
}

export const FormCheckbox = forwardRef<HTMLDivElement, FormCheckboxProps>(
  ({ name, label, description, containerClassName, error, disabled }, ref) => {
    const form = useFormContext();
    const fieldError = error || form?.formState?.errors?.[name]?.message;

    return (
      <div className={cn('space-y-2', containerClassName)} ref={ref}>
        <Controller
          name={name}
          control={form?.control}
          render={({ field }) => (
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id={name}
                checked={field.value}
                onChange={field.onChange}
                disabled={disabled}
                className={cn(
                  'mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary',
                  fieldError && 'border-red-500 focus:ring-red-500'
                )}
              />
              <div className="space-y-1">
                {label && (
                  <Label htmlFor={name} className="text-sm font-medium">
                    {label}
                  </Label>
                )}
                {description && !fieldError && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
                {fieldError && (
                  <p className="text-sm text-red-500">{fieldError as string}</p>
                )}
              </div>
            </div>
          )}
        />
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';
