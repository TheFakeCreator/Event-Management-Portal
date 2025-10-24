import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Simple loading component wrapper
const SimpleLoading = ({ text }: { text?: string }) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" />
    {text && <span className="ml-2 text-muted-foreground">{text}</span>}
  </div>
);

// Page-level loading component
const PageLoading = ({ text }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
    {text && <span className="ml-2 text-muted-foreground">{text}</span>}
  </div>
);

// Lazy load form components
export const LazyEventCreationForm = dynamic(
  () =>
    import('@/components/forms/event-creation-form').then((mod) => ({
      default: mod.EventCreationForm,
    })),
  {
    loading: () => <PageLoading text="Loading event form..." />,
    ssr: false,
  }
);

export const LazyLoginForm = dynamic(
  () =>
    import('@/components/forms/login-form').then((mod) => ({
      default: mod.LoginForm,
    })),
  {
    loading: () => <SimpleLoading text="Loading login form..." />,
    ssr: false,
  }
);

export const LazyRegisterForm = dynamic(
  () =>
    import('@/components/forms/register-form').then((mod) => ({
      default: mod.RegisterForm,
    })),
  {
    loading: () => <SimpleLoading text="Loading register form..." />,
    ssr: false,
  }
);

// Lazy load UI components
export const LazyMultiStepForm = dynamic(
  () =>
    import('@/components/ui/multi-step-form').then((mod) => ({
      default: mod.MultiStepForm,
    })),
  {
    loading: () => <SimpleLoading text="Loading form..." />,
    ssr: false,
  }
);

export const LazyFileUpload = dynamic(
  () =>
    import('@/components/ui/file-upload').then((mod) => ({
      default: mod.FileUpload,
    })),
  {
    loading: () => (
      <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
        <SimpleLoading text="Loading file upload..." />
      </div>
    ),
    ssr: false,
  }
);

export const LazyDatePicker = dynamic(
  () =>
    import('@/components/ui/date-picker').then((mod) => ({
      default: mod.DatePicker,
    })),
  {
    loading: () => (
      <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
    ),
    ssr: false,
  }
);

// Utility function for creating lazy components with custom loading
export function withLazyLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | T>,
  loadingComponent?: ComponentType,
  options: {
    ssr?: boolean;
    loadingText?: string;
  } = {}
) {
  const { ssr = false, loadingText = 'Loading...' } = options;

  const LoadingComponent =
    loadingComponent || (() => <SimpleLoading text={loadingText} />);

  return dynamic(importFunc, {
    loading: () => <LoadingComponent />,
    ssr,
  });
}

// Higher-order component for route-based code splitting
export function withRouteLoading<T extends ComponentType<any>>(
  Component: T,
  loadingText?: string
) {
  return function RouteLazyComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<PageLoading text={loadingText} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Preload critical components
export function preloadCriticalComponents() {
  const preloadPromises = [
    import('@/components/forms/login-form'),
    import('@/components/forms/register-form'),
    import('@/components/ui/button'),
    import('@/components/ui/card'),
  ];

  return Promise.all(preloadPromises).catch(console.warn);
}

// Performance monitoring for lazy components
export function trackLazyComponentLoad(componentName: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Lazy component "${componentName}" loaded in ${loadTime.toFixed(2)}ms`
        );
      }
    };
  }

  return () => {};
}

// Bundle size optimization helpers
export const optimizationHelpers = {
  // Tree-shaking friendly imports
  loadDateUtility: () => import('date-fns'),
  loadValidation: () => import('zod'),
};

// Lazy loading configuration
export const lazyConfig = {
  // Intersection Observer for lazy loading
  useIntersectionObserver: (callback: () => void) => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    return observer;
  },

  // Prefetch on hover
  prefetchOnHover: (importFunc: () => Promise<any>) => {
    return {
      onMouseEnter: () => importFunc().catch(() => {}),
    };
  },
};
