import React from 'react';
import { Header } from '@/components/navigation/header';
import { Sidebar, MobileSidebarTrigger } from '@/components/navigation/Sidebar';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  showBreadcrumbs?: boolean;
  showFooter?: boolean;
  showHeader?: boolean;
  breadcrumbItems?: Array<{ label: string; href: string; current?: boolean }>;
  sidebarClassName?: string;
  mainClassName?: string;
}

export function AppLayout({
  children,
  className,
  showSidebar = false,
  showBreadcrumbs = true,
  showFooter = true,
  showHeader = true,
  breadcrumbItems,
  sidebarClassName,
  mainClassName,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}

      <div className="flex flex-1">
        {showSidebar && (
          <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex">
              <Sidebar className={sidebarClassName} />
            </aside>

            {/* Mobile Sidebar Trigger - integrated into main content for mobile */}
            <div className="lg:hidden fixed top-4 left-4 z-40">
              <MobileSidebarTrigger />
            </div>
          </>
        )}

        <main
          className={cn(
            'flex-1 flex flex-col',
            showSidebar && 'lg:ml-0', // Sidebar takes care of its own width
            mainClassName
          )}
        >
          <div className={cn('flex-1', className)}>
            <div className="container mx-auto px-4 py-6">
              {showBreadcrumbs && (
                <div className="mb-6">
                  <Breadcrumbs items={breadcrumbItems} />
                </div>
              )}
              {children}
            </div>
          </div>

          {showFooter && <Footer />}
        </main>
      </div>
    </div>
  );
}

// Specific layout variants for common use cases
interface DashboardLayoutProps extends Omit<AppLayoutProps, 'showSidebar'> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DashboardLayout({
  children,
  title,
  description,
  actions,
  ...props
}: DashboardLayoutProps) {
  return (
    <AppLayout showSidebar {...props}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            {title && (
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            )}
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </AppLayout>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  showHeader = false,
  showFooter = false,
  className,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}

      <main className="flex-1 flex items-center justify-center p-4">
        <div className={cn('w-full max-w-md space-y-6', className)}>
          {(title || description) && (
            <div className="text-center">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="text-muted-foreground mt-2">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

interface ErrorLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function ErrorLayout({
  children,
  showHeader = true,
  showFooter = true,
  className,
}: ErrorLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}

      <main className="flex-1 flex items-center justify-center p-4">
        <div className={cn('text-center space-y-6', className)}>{children}</div>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
