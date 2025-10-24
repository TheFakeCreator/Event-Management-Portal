// Performance monitoring utilities for production optimization

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      try {
        const vitalsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const value =
              (entry as any).value ||
              (entry as any).processingStart ||
              entry.startTime;
            this.recordMetric({
              name: entry.name,
              value: value,
              timestamp: Date.now(),
              url: window.location.pathname,
            });
          }
        });

        // Observe different types of performance entries
        vitalsObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        vitalsObserver.observe({ entryTypes: ['first-input'] });
        vitalsObserver.observe({ entryTypes: ['layout-shift'] });

        this.observers.push(vitalsObserver);
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Navigation timing observer
    if ('navigation' in performance) {
      this.recordNavigationMetrics();
    }
  }

  private recordNavigationMetrics() {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      const metrics = [
        {
          name: 'dns-lookup',
          value: navigation.domainLookupEnd - navigation.domainLookupStart,
        },
        {
          name: 'tcp-connect',
          value: navigation.connectEnd - navigation.connectStart,
        },
        {
          name: 'server-response',
          value: navigation.responseEnd - navigation.requestStart,
        },
        {
          name: 'dom-interactive',
          value: navigation.domInteractive - navigation.fetchStart,
        },
        {
          name: 'dom-complete',
          value: navigation.domComplete - navigation.fetchStart,
        },
        {
          name: 'load-complete',
          value: navigation.loadEventEnd - navigation.fetchStart,
        },
      ];

      metrics.forEach((metric) => {
        if (metric.value > 0) {
          this.recordMetric({
            ...metric,
            timestamp: Date.now(),
            url: window.location.pathname,
          });
        }
      });
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${metric.name} = ${metric.value.toFixed(2)}ms`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        page_path: metric.url,
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(() => {}); // Silent fail
    }
  }

  // Measure custom performance
  measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return asyncFn().finally(() => {
      const endTime = performance.now();
      this.recordMetric({
        name: `custom-${name}`,
        value: endTime - startTime,
        timestamp: Date.now(),
        url: window.location.pathname,
      });
    });
  }

  measureSync<T>(name: string, syncFn: () => T): T {
    const startTime = performance.now();
    const result = syncFn();
    const endTime = performance.now();

    this.recordMetric({
      name: `custom-${name}`,
      value: endTime - startTime,
      timestamp: Date.now(),
      url: window.location.pathname,
    });

    return result;
  }

  // Get performance summary
  getSummary() {
    const groupedMetrics = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = [];
        }
        acc[metric.name].push(metric.value);
        return acc;
      },
      {} as Record<string, number[]>
    );

    const summary = Object.entries(groupedMetrics).map(([name, values]) => ({
      name,
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }));

    return summary;
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }

  // Cleanup
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const measureComponent = (componentName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      performanceMonitor.recordMetric({
        name: `component-${componentName}`,
        value: endTime - startTime,
        timestamp: Date.now(),
        url: window.location.pathname,
      });
    };
  };

  return {
    measureComponent,
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
  };
}

// Core Web Vitals measurement
export function measureCoreWebVitals() {
  // Largest Contentful Paint (LCP)
  const measureLCP = () => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        performanceMonitor.recordMetric({
          name: 'lcp',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          url: window.location.pathname,
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  };

  // First Input Delay (FID)
  const measureFID = () => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          performanceMonitor.recordMetric({
            name: 'fid',
            value: (entry as any).processingStart - entry.startTime,
            timestamp: Date.now(),
            url: window.location.pathname,
          });
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
    }
  };

  // Cumulative Layout Shift (CLS)
  const measureCLS = () => {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        performanceMonitor.recordMetric({
          name: 'cls',
          value: clsValue,
          timestamp: Date.now(),
          url: window.location.pathname,
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }
  };

  // Initialize all measurements
  if (typeof window !== 'undefined') {
    measureLCP();
    measureFID();
    measureCLS();
  }
}

// Bundle analysis utilities
export const bundleAnalyzer = {
  // Measure JavaScript bundle size impact
  measureBundleImpact: (bundleName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(
        `Bundle ${bundleName} loaded in ${(endTime - startTime).toFixed(2)}ms`
      );
    };
  },

  // Report large bundles in development
  reportLargeBundles: () => {
    if (process.env.NODE_ENV === 'development' && 'performance' in window) {
      const resources = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];
      const jsResources = resources.filter((r) => r.name.includes('.js'));

      jsResources
        .filter((r) => r.transferSize > 100000) // > 100KB
        .forEach((r) => {
          console.warn(
            `Large JS bundle detected: ${r.name} (${(r.transferSize / 1024).toFixed(2)}KB)`
          );
        });
    }
  },
};

// Performance optimization tips
export const performanceOptimization = {
  // Prefetch critical resources
  prefetchCriticalResources: () => {
    const criticalResources = ['/api/auth/session', '/images/logo.png'];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  },

  // Lazy load images with intersection observer
  lazyLoadImages: () => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  },

  // Optimize font loading
  optimizeFontLoading: () => {
    if ('fonts' in document) {
      const font = new FontFace(
        'Inter',
        'url(/fonts/inter-variable.woff2) format("woff2")',
        { display: 'swap' }
      );

      font.load().then(() => {
        document.fonts.add(font);
        document.body.classList.add('font-loaded');
      });
    }
  },
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Start core web vitals measurement
  measureCoreWebVitals();

  // Report bundle analysis in development
  setTimeout(() => {
    bundleAnalyzer.reportLargeBundles();
  }, 2000);
}
