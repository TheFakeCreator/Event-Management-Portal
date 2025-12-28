'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface AnalyticsPreferences {
  essential: boolean; // Always true, required for auth
  analytics: boolean;
  marketing: boolean;
}

interface AnalyticsContextType {
  preferences: AnalyticsPreferences;
  updatePreferences: (prefs: Partial<AnalyticsPreferences>) => void;
  hasConsented: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
}

const defaultPreferences: AnalyticsPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

const COOKIE_NAME = 'cookie_consent';
const COOKIE_EXPIRY = 365; // days

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] =
    useState<AnalyticsPreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from cookie on mount
  useEffect(() => {
    const savedPrefs = Cookies.get(COOKIE_NAME);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(parsed);
        setHasConsented(true);

        // Initialize analytics if consented
        if (parsed.analytics) {
          initializeAnalytics();
        }
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  const updatePreferences = (newPrefs: Partial<AnalyticsPreferences>) => {
    const updated = { ...preferences, ...newPrefs, essential: true };
    setPreferences(updated);
    setHasConsented(true);

    // Save to cookie
    Cookies.set(COOKIE_NAME, JSON.stringify(updated), {
      expires: COOKIE_EXPIRY,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Initialize or cleanup analytics based on new preferences
    if (updated.analytics) {
      initializeAnalytics();
    } else {
      cleanupAnalytics();
    }
  };

  const acceptAll = () => {
    updatePreferences({ analytics: true, marketing: true });
  };

  const rejectAll = () => {
    updatePreferences({ analytics: false, marketing: false });
  };

  const initializeAnalytics = () => {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!gaId || typeof window === 'undefined') return;

    // Check if gtag is already loaded
    if ('gtag' in window) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function () {
        (window as any).dataLayer.push(arguments);
      };
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', gaId, {
        page_path: window.location.pathname,
        anonymize_ip: true, // GDPR compliance
      });
      (window as any).gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
      });
    };
  };

  const cleanupAnalytics = () => {
    if (typeof window === 'undefined' || !('gtag' in window)) return;

    // Revoke consent
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  };

  return (
    <AnalyticsContext.Provider
      value={{
        preferences,
        updatePreferences,
        hasConsented,
        acceptAll,
        rejectAll,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

// Utility function to track events (only if analytics enabled)
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window === 'undefined' || !('gtag' in window)) return;

  const savedPrefs = Cookies.get(COOKIE_NAME);
  if (!savedPrefs) return;

  try {
    const prefs = JSON.parse(savedPrefs);
    if (prefs.analytics) {
      (window as any).gtag('event', eventName, eventParams);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Utility function to track page views
export function trackPageView(url: string) {
  trackEvent('page_view', {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
}
