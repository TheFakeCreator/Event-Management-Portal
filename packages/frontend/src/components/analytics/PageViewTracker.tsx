'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/contexts/AnalyticsContext';

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}
