'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie, Settings, Shield, BarChart3, Target } from 'lucide-react';

export function CookieConsentBanner() {
  const { hasConsented, acceptAll, rejectAll, updatePreferences } =
    useAnalytics();
  const [showBanner, setShowBanner] = useState(!hasConsented);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
  });

  if (!showBanner) return null;

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    updatePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (showSettings) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Cookie className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Cookie Preferences</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-muted-foreground mb-6">
            We use cookies to enhance your experience, analyze site traffic, and
            personalize content. You can choose which types of cookies to allow.
          </p>

          <div className="space-y-6">
            {/* Essential Cookies */}
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
              <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Essential Cookies</h3>
                  <span className="text-sm text-muted-foreground">
                    Always Active
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for authentication, security, and basic site
                  functionality. These cookies cannot be disabled.
                </p>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Analytics Cookies</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          analytics: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our website. We
                  use Google Analytics with IP anonymization for GDPR
                  compliance.
                </p>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Target className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Marketing Cookies</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          marketing: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Used to track visitors across websites and display ads that
                  are relevant to you. Currently not implemented.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleRejectAll}
              className="flex-1"
            >
              Reject All
            </Button>
            <Button onClick={handleSavePreferences} className="flex-1">
              Save Preferences
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            You can change your preferences at any time in the settings.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <Card className="max-w-5xl mx-auto p-6 shadow-2xl border-2">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                We Value Your Privacy
              </h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, analyze site
                traffic, and personalize content. By clicking "Accept All", you
                consent to our use of cookies. You can customize your
                preferences or learn more in our{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
            <Button
              variant="outline"
              onClick={handleRejectAll}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
              Accept All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Cookie settings button for settings page
export function CookieSettingsButton() {
  const { updatePreferences, preferences } = useAnalytics();
  const [showSettings, setShowSettings] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    updatePreferences(localPrefs);
    setShowSettings(false);
  };

  if (!showSettings) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          setLocalPrefs(preferences);
          setShowSettings(true);
        }}
      >
        <Cookie className="w-4 h-4 mr-2" />
        Manage Cookie Preferences
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <Card className="max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Cookie Settings</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Essential Cookies</p>
              <p className="text-sm text-muted-foreground">Always active</p>
            </div>
            <span className="text-sm text-muted-foreground">Required</span>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Analytics Cookies</p>
              <p className="text-sm text-muted-foreground">Help us improve</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.analytics}
                onChange={(e) =>
                  setLocalPrefs({ ...localPrefs, analytics: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Marketing Cookies</p>
              <p className="text-sm text-muted-foreground">Personalized ads</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.marketing}
                onChange={(e) =>
                  setLocalPrefs({ ...localPrefs, marketing: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowSettings(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
