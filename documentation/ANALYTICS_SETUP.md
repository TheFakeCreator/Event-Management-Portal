# Analytics & Cookie Consent System

## Overview

This application implements a comprehensive analytics and cookie consent system that is fully GDPR compliant. Users can control which types of cookies they want to allow, and analytics are only loaded after explicit consent.

## Features

### ✅ Cookie Categories

1. **Essential Cookies** (Always Active)
   - Required for authentication (NextAuth session)
   - Security features
   - Basic site functionality
   - Cannot be disabled

2. **Analytics Cookies** (Optional)
   - Google Analytics 4 with IP anonymization
   - Performance monitoring
   - Error tracking
   - Page view tracking
   - User behavior analysis

3. **Marketing Cookies** (Optional)
   - Placeholder for future ad tracking
   - Currently not implemented

### 🔒 GDPR Compliance

- ✅ Explicit consent required before loading analytics
- ✅ IP anonymization enabled in Google Analytics
- ✅ User preferences stored in local cookies (365 days)
- ✅ Easy to change preferences at any time
- ✅ Granular control over cookie categories
- ✅ Clear privacy information

## Setup Instructions

### 1. Get Google Analytics 4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use existing)
3. Go to **Admin** → **Data Streams** → **Web**
4. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variables

Add your GA4 Measurement ID to `.env.local`:

```env
# Google Analytics 4 Measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Test the Integration

1. Start your development server:
   ```bash
   cd packages/frontend
   pnpm dev
   ```

2. Open your browser and navigate to your app

3. You should see the cookie consent banner at the bottom

4. Click "Accept All" or "Customize" to set your preferences

5. Check the browser console for analytics logs (in development mode)

6. Verify in Google Analytics Real-Time reports (may take a few minutes)

## How It Works

### Cookie Consent Flow

```
User Visits Site
      ↓
Cookie Consent Banner Appears
      ↓
User Chooses:
  ├─ Accept All → All cookies enabled
  ├─ Reject All → Only essential cookies
  └─ Customize → Choose specific categories
      ↓
Preferences Saved to Cookie (365 days)
      ↓
Analytics Scripts Load (if consented)
```

### Components Architecture

```
RootLayout
  └─ AnalyticsProvider (Context)
       ├─ PageViewTracker (Auto track page changes)
       ├─ CookieConsentBanner (First visit)
       └─ Your App Content
            └─ CookieSettingsButton (Settings page)
```

## Usage in Code

### Track Custom Events

```typescript
import { trackEvent } from '@/contexts/AnalyticsContext';

// Track button click
trackEvent('button_click', {
  button_name: 'register_event',
  event_id: '123',
  category: 'engagement',
});

// Track form submission
trackEvent('form_submit', {
  form_name: 'contact',
  success: true,
});

// Track feature usage
trackEvent('feature_used', {
  feature_name: 'dark_mode',
  value: 'enabled',
});
```

### Check Analytics Status

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';

function MyComponent() {
  const { preferences, hasConsented } = useAnalytics();

  if (preferences.analytics) {
    // Analytics are enabled
    trackEvent('my_event');
  }

  return <div>Analytics: {hasConsented ? 'Enabled' : 'Not set'}</div>;
}
```

### Add Cookie Settings to Settings Page

```typescript
import { CookieSettingsButton } from '@/components/analytics/CookieConsent';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <CookieSettingsButton />
    </div>
  );
}
```

## Tracked Metrics

### Automatic Tracking

1. **Page Views**
   - Every route change
   - URL, title, and timestamp

2. **Performance Metrics**
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)
   - Time to First Byte (TTFB)

3. **Errors**
   - JavaScript exceptions
   - API errors
   - Component errors (Error Boundaries)

### Custom Events You Can Add

```typescript
// User interactions
trackEvent('click', { element: 'nav_button', location: 'header' });

// Feature usage
trackEvent('search', { query: 'events', results: 10 });

// Business metrics
trackEvent('registration', { event_id: '123', user_role: 'student' });

// Engagement
trackEvent('video_play', { video_id: '456', duration: 120 });
```

## Privacy & Data

### What We Track (with consent)

- ✅ Page URLs and titles
- ✅ Device type and browser
- ✅ Geographic location (city/country only)
- ✅ User interactions (anonymized)
- ✅ Performance metrics

### What We DON'T Track

- ❌ Personal identifiable information (PII)
- ❌ Full IP addresses (anonymized)
- ❌ Passwords or sensitive data
- ❌ Precise location (only city/country)
- ❌ Cross-site tracking

### IP Anonymization

Google Analytics is configured with `anonymize_ip: true`, which:
- Removes the last octet of IPv4 addresses
- Removes the last 80 bits of IPv6 addresses
- Happens before data storage

## Cookie Details

### Essential Cookies

| Name | Purpose | Duration |
|------|---------|----------|
| `next-auth.session-token` | Authentication | Session |
| `next-auth.csrf-token` | CSRF protection | Session |

### Analytics Cookies (if consented)

| Name | Purpose | Duration |
|------|---------|----------|
| `_ga` | Distinguish users | 2 years |
| `_ga_*` | Session state | 2 years |
| `_gid` | Distinguish users | 24 hours |

### Preference Cookie

| Name | Purpose | Duration |
|------|---------|----------|
| `cookie_consent` | Store user preferences | 365 days |

## Testing

### Development Mode

In development, analytics events are logged to the console:

```
[AnalyticsContext] Tracking: page_view
[AnalyticsContext] Params: { page_path: "/dashboard", ... }
```

### Production Mode

In production:
- Console logs are disabled
- Events are sent to Google Analytics
- Real-time data appears in GA dashboard

### Test Checklist

- [ ] Cookie banner appears on first visit
- [ ] Preferences are saved correctly
- [ ] Analytics only load after consent
- [ ] Page views are tracked
- [ ] Custom events are logged
- [ ] Settings page allows preference changes
- [ ] Rejecting cookies stops tracking

## Compliance Notes

### GDPR (European Union)

✅ **Compliant** - Explicit consent required before analytics

### CCPA (California)

✅ **Compliant** - Users can opt-out of analytics

### PECR (UK)

✅ **Compliant** - Non-essential cookies require consent

## Troubleshooting

### Analytics Not Loading

1. Check environment variable:
   ```bash
   echo $NEXT_PUBLIC_GA_MEASUREMENT_ID
   ```

2. Verify consent was given:
   ```javascript
   // In browser console
   document.cookie
   // Should show: cookie_consent={"essential":true,"analytics":true,...}
   ```

3. Check browser network tab for `googletagmanager.com` requests

### Events Not Appearing in GA

- Real-time reports can take 2-5 minutes
- Check GA4 DebugView for immediate feedback
- Enable GA4 debug mode: `gtag('set', { debug_mode: true })`

### Cookie Banner Not Showing

- Check if consent cookie exists (already gave consent)
- Clear cookies and reload
- Verify AnalyticsProvider is in app layout

## Future Enhancements

- [ ] Consent mode v2 for enhanced GA4 compliance
- [ ] Server-side tracking for better accuracy
- [ ] A/B testing integration
- [ ] Heatmap tracking (Hotjar/Microsoft Clarity)
- [ ] Session recording (with consent)
- [ ] Custom dashboard for analytics
- [ ] Export user data (GDPR right to data portability)
- [ ] Automated consent banner A/B testing

## Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GDPR Compliance Guide](https://gdpr.eu/cookies/)
- [Consent Mode v2](https://support.google.com/analytics/answer/9976101)
- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
