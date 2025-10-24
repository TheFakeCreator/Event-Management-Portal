'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout, PageWrapper } from '@/components/layout';
import { APP_CONFIG } from '@/lib/constants';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AboutPage() {
  return (
    <MainLayout>
      <PageWrapper title="About" description={`About ${APP_CONFIG.NAME}`}>
        <div className="space-y-8">
          {/* Hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold">{APP_CONFIG.NAME}</h2>
              <p className="mt-3 text-base text-muted-foreground max-w-2xl">
                {APP_CONFIG.DESCRIPTION}. We build tools that help communities
                organize, run events, and collaborate. Our goal is to make event
                management simple, accessible, and open to everyone.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Badge>Open Source</Badge>
                <Badge>Self-host</Badge>
                <Badge>Universities</Badge>
                <Badge>Clubs</Badge>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <a
                    href="https://github.com/TheFakeCreator/Event-Management-Portal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on GitHub
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/features">Release notes</Link>
                </Button>
              </div>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-semibold">Project</h4>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div>
                      <strong>Version:</strong> {APP_CONFIG.VERSION}
                    </div>
                    <div>
                      <strong>Author:</strong>{' '}
                      {APP_CONFIG.AUTHOR || 'Community'}
                    </div>
                    <div>
                      <strong>License:</strong>{' '}
                      <Link
                        href="/LICENSE"
                        className="text-primary hover:underline"
                      >
                        See LICENSE
                      </Link>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-muted-foreground">
                    Built with community contributions
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Who we are + Get involved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold">Who we are</h4>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A small team of developers and community organizers building a
                  flexible platform for universities, student clubs, and public
                  communities. We focus on performance, accessibility, and
                  developer experience.
                </p>
                <ul className="mt-4 list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Contribute on GitHub</li>
                  <li>Report issues and suggest features</li>
                  <li>Help others in discussions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold">Get involved</h4>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  There are many ways to help:
                </p>
                <ul className="mt-3 list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    <a
                      href="https://github.com/TheFakeCreator/Event-Management-Portal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Star &amp; fork the repo
                    </a>
                  </li>
                  <li>Open issues or PRs for bugs and features</li>
                  <li>Share the project with your community</li>
                </ul>

                <div className="mt-4">
                  <Button asChild>
                    <a
                      href="https://github.com/TheFakeCreator/Event-Management-Portal/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open an issue
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
