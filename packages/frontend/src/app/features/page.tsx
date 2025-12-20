'use client';

import React from 'react';
import { MainLayout, PageWrapper } from '@/components/layout';
import { ROUTES, APP_CONFIG } from '@/lib/constants';

const RELEASES = [
  {
    version: APP_CONFIG.VERSION,
    date: '2025-10-24',
    highlights: [
      'Improved dashboard welcome behavior (session-based toast)',
      'Fixed profile tooltip outside-click closing',
      'Added placeholder images to avoid 404s',
    ],
  },
  {
    version: '1.9.0',
    date: '2025-09-01',
    highlights: ['Performance improvements', 'Minor UI refinements'],
  },
];

export default function FeaturesPage() {
  return (
    <MainLayout>
      <PageWrapper
        title="Release Notes & Features"
        description="Track new features and release highlights for the Event Management Portal"
      >
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            This page lists notable features and changes shipped with each
            release. You can edit this file to add the next release notes or
            switch to a content-driven approach (markdown or a small CMS) if
            you&apos;d like non-developers to publish releases.
          </p>

          <div className="space-y-8">
            {RELEASES.map((rel) => (
              <div key={rel.version} className="border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Version {rel.version}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Released on {rel.date}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 list-disc list-inside space-y-2">
                  {rel.highlights.map((h, i) => (
                    <li key={i} className="text-sm">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
