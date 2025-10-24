import React from 'react';
import { Header } from '@/components/navigation/header';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
  showHeader?: boolean;
  containerClassName?: string;
}

export function MainLayout({
  children,
  className,
  showFooter = true,
  showHeader = true,
  containerClassName,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}

      <main className={cn('flex-1', className)}>
        <div className={cn('container mx-auto px-4', containerClassName)}>
          {children}
        </div>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

export function PageWrapper({
  children,
  title,
  description,
  className,
  maxWidth = 'full',
  padding = true,
}: PageWrapperProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-none',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        padding && 'py-8',
        className
      )}
    >
      {(title || description) && (
        <div className="mb-8">
          {title && (
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-lg text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  background?: 'default' | 'muted' | 'accent';
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

export function Section({
  children,
  title,
  description,
  className,
  background = 'default',
  padding = 'lg',
}: SectionProps) {
  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted',
    accent: 'bg-accent',
  };

  const paddingClasses = {
    none: '',
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
    xl: 'py-16',
  };

  return (
    <section
      className={cn(
        backgroundClasses[background],
        paddingClasses[padding],
        className
      )}
    >
      <div className="container mx-auto px-4">
        {(title || description) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'centered' | 'narrow';
}

export function ContentWrapper({
  children,
  className,
  variant = 'default',
}: ContentWrapperProps) {
  const variantClasses = {
    default: 'max-w-none',
    centered: 'max-w-4xl mx-auto text-center',
    narrow: 'max-w-2xl mx-auto',
  };

  return (
    <div className={cn(variantClasses[variant], className)}>{children}</div>
  );
}
