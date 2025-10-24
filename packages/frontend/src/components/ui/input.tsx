import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  variant?: 'default' | 'filled';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      isLoading,
      variant = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const id = React.useId();

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const hasError = Boolean(error);

    const inputClasses = cn(
      // Base styles
      'flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
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

      // Icon padding adjustments
      leftIcon && 'pl-10',
      (rightIcon || isPassword) && 'pr-10',

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
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            id={id}
            type={inputType}
            className={inputClasses}
            ref={ref}
            disabled={disabled || isLoading}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {isPassword && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled || isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {rightIcon && !isPassword && (
              <div className="text-muted-foreground">{rightIcon}</div>
            )}
            {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>

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
Input.displayName = 'Input';

export { Input };
