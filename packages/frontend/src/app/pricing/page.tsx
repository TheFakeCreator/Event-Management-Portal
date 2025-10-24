'use client';

import React from 'react';
import { MainLayout, PageWrapper } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';

const TIERS = [
  {
    id: 'free',
    name: 'Open Source — Free Forever',
    price: '0',
    frequency: '',
    description:
      'The fully open-source edition is free forever. Ideal for developers, student clubs, and community groups. Self-host or deploy on your infrastructure.',
    highlights: [
      'Open-source license',
      'Self-hosting / On-premise',
      'Community support via GitHub',
    ],
    cta: 'View on GitHub',
    variant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '15',
    frequency: 'month',
    description: 'For active organizers and growing communities',
    highlights: ['Unlimited events', 'Priority support', 'Custom branding'],
    cta: 'Start Free Trial',
    variant: 'primary',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise / Institutions',
    price: 'Contact',
    frequency: '',
    description:
      'Paid implementations for universities, colleges and large organizations. Includes integration work, hosted deployments, SLAs, and training.',
    highlights: [
      'Custom implementation & integrations',
      'On-prem / Hosted deployment',
      'SLA, onboarding & training',
    ],
    cta: 'Contact Sales',
    variant: 'ghost',
  },
];

export default function PricingPage() {
  return (
    <MainLayout>
      <PageWrapper
        title="Pricing"
        description="Choose a plan that fits your community"
      >
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              The core Event Management Portal is open-source and free forever
              for self-hosting and community use. We provide paid implementation
              and hosted plans for universities, colleges, and enterprises that
              need custom integrations, onboarding, or SLA-backed hosting.
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={`p-6 ${tier.popular ? 'border-2 border-primary' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>
                  {tier.popular && (
                    <Badge className="text-xs">Most Popular</Badge>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {tier.price === 'Contact' ? tier.price : `$${tier.price}`}
                    </span>
                    {tier.frequency && (
                      <span className="text-sm text-muted-foreground">
                        / {tier.frequency}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mt-6 space-y-2 text-sm">
                  {tier.highlights.map((h, idx) => (
                    <li key={idx} className="text-sm">
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Button
                    asChild
                    className="w-full"
                    variant={tier.variant as any}
                  >
                    {tier.id === 'free' ? (
                      <a
                        href="https://github.com/TheFakeCreator/Event-Management-Portal"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tier.cta}
                      </a>
                    ) : tier.id === 'enterprise' ? (
                      <a href={`${ROUTES.CONTACT}`}>{tier.cta}</a>
                    ) : (
                      <a href={`${ROUTES.REGISTER}`}>{tier.cta}</a>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
