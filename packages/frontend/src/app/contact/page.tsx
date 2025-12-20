'use client';

import React, { useState } from 'react';
import { MainLayout, PageWrapper } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

type FormState = {
  name: string;
  email: string;
  organization?: string;
  message: string;
  honey?: string; // honeypot
};

const initialState: FormState = {
  name: '',
  email: '',
  organization: '',
  message: '',
  honey: '',
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { success, error } = useToast();

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!form.email.trim()) e.email = 'Please enter your email';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = 'Please enter a valid email';
    if (!form.message.trim() || form.message.trim().length < 10)
      e.message = 'Please enter a message (at least 10 characters)';
    // honeypot should be empty
    if (form.honey && form.honey.trim().length > 0) {
      // silently fail validation to thwart bots
      return false;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange =
    (field: keyof FormState) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((s) => ({ ...s, [field]: ev.target.value }));
    };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          organization: form.organization,
          message: form.message,
        }),
      });

      if (res.ok) {
        setSent(true);
        success('Message sent', 'Thanks — we will get back to you soon');
        setForm(initialState);
      } else {
        // fallback to mailto if server endpoint is not available
        const fallback = `mailto:support@${typeof window !== 'undefined' ? window.location.hostname : 'example.com'}?subject=${encodeURIComponent(
          'Contact from website'
        )}&body=${encodeURIComponent(`Name: ${form.name}\nOrganization: ${form.organization || ''}\n\n${form.message}`)}`;
        error(
          'Unable to send',
          'No server available — opening your mail client as fallback'
        );
        window.location.href = fallback;
      }
    } catch (err) {
      console.error('Contact submit error', err);
      error(
        'Failed to send',
        'Something went wrong. Please try again or use email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <PageWrapper title="Contact" description="Contact the team">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Contact us</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Questions about hosting, integrations, or contributions? Send us
                a message.
              </p>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="space-y-4">
                  <p className="text-sm">
                    Thanks — your message was sent. We&apos;ll respond as soon
                    as possible.
                  </p>
                  <Button onClick={() => setSent(false)}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="organization">
                      Organization (optional)
                    </Label>
                    <Input
                      id="organization"
                      value={form.organization}
                      onChange={handleChange('organization')}
                      placeholder="University / Club / Company"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={handleChange('message')}
                      placeholder="How can we help?"
                    />
                    {errors.message && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* honeypot field for bots (hidden) */}
                  <div style={{ display: 'none' }} aria-hidden>
                    <Label htmlFor="company">Company (leave empty)</Label>
                    <Input
                      id="company"
                      value={form.honey}
                      onChange={handleChange('honey')}
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Sending...' : 'Send message'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        window.location.assign(
                          'mailto:support@' +
                            (typeof window !== 'undefined'
                              ? window.location.hostname
                              : 'example.com')
                        )
                      }
                    >
                      Email us directly
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                We usually respond within 2 business days. For urgent issues
                include a phone number in your message.
              </p>
            </CardFooter>
          </Card>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
