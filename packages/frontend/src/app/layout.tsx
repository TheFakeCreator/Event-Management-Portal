import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SessionProvider, QueryProvider } from '@/components/providers';
import { ToastProvider } from '@/components/ui/toast';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { CookieConsentBanner } from '@/components/analytics/CookieConsent';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Event Management Portal',
  description: 'Discover and create events that bring communities together',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Prevent FOUC: Set theme before React renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <QueryProvider>
          <SessionProvider>
            <AnalyticsProvider>
              <ToastProvider>
                <PageViewTracker />
                {children}
                <CookieConsentBanner />
              </ToastProvider>
            </AnalyticsProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
