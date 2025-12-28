'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleBasedDashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CookieSettingsButton } from '@/components/analytics/CookieConsent';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Mail,
  Database,
  Globe,
  Save,
  RotateCcw,
  Cookie,
} from 'lucide-react';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  maxEventsPerUser: number;
  maxClubsPerUser: number;
  allowPublicRegistration: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  eventReminders: boolean;
  clubUpdates: boolean;
  systemAlerts: boolean;
  reminderTimeBeforeEvent: number;
}

interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
  requireTwoFactor: boolean;
}

interface EmailSettings {
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromEmail: string;
  fromName: string;
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <Settings />
    </ProtectedRoute>
  );
}

function Settings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Event Management Portal',
    siteDescription: 'Manage your college events and clubs',
    supportEmail: 'support@eventmanagement.com',
    maxEventsPerUser: 10,
    maxClubsPerUser: 5,
    allowPublicRegistration: true,
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      eventReminders: true,
      clubUpdates: true,
      systemAlerts: true,
      reminderTimeBeforeEvent: 24,
    });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireEmailVerification: true,
    requireTwoFactor: false,
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    fromEmail: 'noreply@eventmanagement.com',
    fromName: 'Event Management',
  });

  const handleSaveGeneralSettings = async () => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        message: 'General settings updated successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        message: 'Failed to update settings',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        message: 'Notification settings updated successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        message: 'Failed to update settings',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        message: 'Security settings updated successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        message: 'Failed to update settings',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        message: 'Email settings updated successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        message: 'Failed to update settings',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setGeneralSettings({
      siteName: 'Event Management Portal',
      siteDescription: 'Manage your college events and clubs',
      supportEmail: 'support@eventmanagement.com',
      maxEventsPerUser: 10,
      maxClubsPerUser: 5,
      allowPublicRegistration: true,
    });

    toast({
      title: 'Reset Complete',
      message: 'Settings reset to defaults',
      type: 'success',
    });
  };

  return (
    <RoleBasedDashboardLayout
      title="Settings"
      description="Manage system settings and preferences"
    >
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Cookie className="w-4 h-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Site Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={generalSettings.siteName}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          siteName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={generalSettings.siteDescription}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          siteDescription: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          supportEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">User Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxEvents">Max Events Per User</Label>
                    <Input
                      id="maxEvents"
                      type="number"
                      min="1"
                      value={generalSettings.maxEventsPerUser}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          maxEventsPerUser: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxClubs">Max Clubs Per User</Label>
                    <Input
                      id="maxClubs"
                      type="number"
                      min="1"
                      value={generalSettings.maxClubsPerUser}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          maxClubsPerUser: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Registration</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Public Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register without invitation
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.allowPublicRegistration}
                    onCheckedChange={(checked: boolean) =>
                      setGeneralSettings({
                        ...generalSettings,
                        allowPublicRegistration: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button onClick={handleSaveGeneralSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleResetToDefaults}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked: boolean) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Event Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminders before events
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.eventReminders}
                      onCheckedChange={(checked: boolean) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          eventReminders: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Club Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify about club announcements
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.clubUpdates}
                      onCheckedChange={(checked: boolean) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          clubUpdates: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important system notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked: boolean) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          systemAlerts: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Reminder Timing</h3>
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">
                    Remind Users Before Event (hours)
                  </Label>
                  <Select
                    value={notificationSettings.reminderTimeBeforeEvent.toString()}
                    onValueChange={(value) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        reminderTimeBeforeEvent: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  onClick={handleSaveNotificationSettings}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Session Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Users will be logged out after this period of inactivity
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Authentication Settings
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          maxLoginAttempts: parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Account will be locked after this many failed attempts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">
                      Minimum Password Length
                    </Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordMinLength: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify email before accessing system
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireEmailVerification}
                      onCheckedChange={(checked: boolean) =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireEmailVerification: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        All users must enable 2FA
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireTwoFactor}
                      onCheckedChange={(checked: boolean) =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireTwoFactor: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button onClick={handleSaveSecuritySettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Email Provider</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      value={emailSettings.provider}
                      onValueChange={(value) =>
                        setEmailSettings({ ...emailSettings, provider: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">SMTP Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            smtpHost: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            smtpPort: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={emailSettings.smtpUser}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          smtpUser: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Sender Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          fromEmail: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          fromName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button onClick={handleSaveEmailSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Privacy & Cookies Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Cookie Preferences
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage how we use cookies and track analytics on this site.
                  Changes take effect immediately.
                </p>

                <div className="flex flex-col gap-4">
                  <CookieSettingsButton />

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">
                      Current Analytics Status
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Google Analytics is{' '}
                      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
                        ? 'configured'
                        : 'not configured'}
                      .
                      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
                        <span className="block mt-1">
                          Measurement ID:{' '}
                          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Privacy Information</h4>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                      <li>
                        We use cookies to enhance your experience and analyze
                        site usage
                      </li>
                      <li>
                        Essential cookies are always active for authentication
                        and security
                      </li>
                      <li>
                        Analytics cookies require your explicit consent (GDPR
                        compliant)
                      </li>
                      <li>
                        IP addresses are anonymized before being sent to Google
                        Analytics
                      </li>
                      <li>
                        No personally identifiable information is shared with
                        third parties
                      </li>
                      <li>
                        You can withdraw consent at any time using the button
                        above
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Data We Collect</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Essential:</strong> Authentication tokens,
                        session data
                      </p>
                      <p>
                        <strong>Analytics (if consented):</strong> Page views,
                        device type, browser, anonymized location, performance
                        metrics
                      </p>
                      <p>
                        <strong>Never Collected:</strong> Passwords, personal
                        messages, precise location, cross-site activity
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" asChild>
                      <a href="/privacy" target="_blank">
                        View Full Privacy Policy
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Privacy Policy
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </RoleBasedDashboardLayout>
  );
}
