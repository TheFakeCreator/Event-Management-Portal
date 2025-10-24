'use client';

import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface FormInputProps extends React.ComponentProps<typeof Input> {
  name: string;
  label?: string;
  description?: string;
  containerClassName?: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      name,
      label,
      description,
      containerClassName,
      error,
      className,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const fieldError = error || form?.formState?.errors?.[name]?.message;
    const { ref: formRef, ...registerProps } = form?.register?.(name) || {};

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          id={name}
          ref={(e) => {
            formRef?.(e);
            if (typeof ref === 'function') ref(e);
            else if (ref) ref.current = e;
          }}
          className={cn(
            fieldError && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...registerProps}
          {...props}
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

FormInput.displayName = 'FormInput';

export interface FormTextareaProps
  extends React.ComponentProps<typeof Textarea> {
  name: string;
  label?: string;
  description?: string;
  containerClassName?: string;
  error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      name,
      label,
      description,
      containerClassName,
      error,
      className,
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const fieldError = error || form?.formState?.errors?.[name]?.message;
    const { ref: formRef, ...registerProps } = form?.register?.(name) || {};

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Textarea
          id={name}
          ref={(e) => {
            formRef?.(e);
            if (typeof ref === 'function') ref(e);
            else if (ref) ref.current = e;
          }}
          className={cn(
            fieldError && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...registerProps}
          {...props}
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

FormTextarea.displayName = 'FormTextarea';
