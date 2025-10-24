'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  error?: Error & { digest?: string };
  reset?: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);

    // Report to analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'exception', {
        description: error?.message || 'Unknown error',
        fatal: false,
        error_digest: error?.digest,
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
          <p className="text-muted-foreground mt-2">
            We apologize for the inconvenience. An unexpected error has
            occurred, but don&apos;t worry - our team has been notified and is
            working on a fix.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {process.env.NODE_ENV === 'development' && error && (
            <details className="group bg-muted/50 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-sm hover:text-primary flex items-center gap-2">
                🐛 Development Error Details
                <span className="text-xs text-muted-foreground">
                  (Development only)
                </span>
              </summary>
              <div className="mt-4 space-y-2">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {error.digest && (
                  <div>
                    <strong>Error ID:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 bg-background p-2 rounded border">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reset && (
              <Button onClick={reset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>

            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Still having trouble? Contact our support team for assistance.
            </p>
            {error?.digest && (
              <p className="text-xs font-mono text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 404 Not Found Page
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="text-6xl font-bold text-muted-foreground mb-4">
            404
          </div>
          <CardTitle className="text-xl">Page Not Found</CardTitle>
          <p className="text-muted-foreground">
            Sorry, the page you are looking for doesn&apos;t exist or has been
            moved.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <Button
              onClick={() => (window.location.href = '/')}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Network Error Page
export function NetworkErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-100 rounded-full">
              <AlertTriangle className="h-12 w-12 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Connection Problem</CardTitle>
          <p className="text-muted-foreground">
            We&apos;re having trouble connecting to our servers. Please check
            your internet connection and try again.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={onRetry || (() => window.location.reload())}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Maintenance Mode Page
export function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="text-4xl mb-4">🔧</div>
          <CardTitle className="text-xl">Under Maintenance</CardTitle>
          <p className="text-muted-foreground">
            We&apos;re currently performing scheduled maintenance to improve
            your experience. We&apos;ll be back shortly!
          </p>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thank you for your patience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
