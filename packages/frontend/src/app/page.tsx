import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  MainLayout,
  PageWrapper,
  Section,
  ContentWrapper,
} from '@/components/layout';
import {
  Calendar,
  Users,
  Plus,
  ArrowRight,
  Star,
  Clock,
  MapPin,
} from 'lucide-react';

export default function HomePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <Section background="muted" padding="xl">
        <ContentWrapper variant="centered">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Discover Events That
            <span className="text-primary"> Matter</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with your community through events and clubs. Create,
            discover, and participate in experiences that inspire you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3">
              Explore Events
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Create Event
              <Plus className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </ContentWrapper>
      </Section>

      {/* Features Section */}
      <Section
        title="Why Choose Our Platform?"
        description="Everything you need to manage and participate in events"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Upcoming Events</h3>
            <p className="text-muted-foreground mb-4">
              Discover and register for exciting events happening in your
              community. Never miss out on what matters to you.
            </p>
            <Button variant="ghost" className="p-0">
              View Events <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Join Clubs</h3>
            <p className="text-muted-foreground mb-4">
              Connect with like-minded people by joining clubs that match your
              interests and passion.
            </p>
            <Button variant="ghost" className="p-0">
              Browse Clubs <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Events</h3>
            <p className="text-muted-foreground mb-4">
              Organize your own events and bring your community together. Easy
              setup and management tools.
            </p>
            <Button variant="ghost" className="p-0">
              Get Started <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Card>
        </div>
      </Section>

      {/* Stats Section */}
      <Section background="accent" padding="lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Events Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">10K+</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Active Clubs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">25K+</div>
            <div className="text-sm text-muted-foreground">Registrations</div>
          </div>
        </div>
      </Section>

      {/* Featured Events */}
      <Section
        title="Featured Events"
        description="Don't miss these popular upcoming events"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/40 relative">
                <div className="absolute top-4 left-4">
                  <div className="bg-background/90 rounded-lg px-3 py-1 text-sm font-medium">
                    Featured
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-primary text-primary-foreground rounded-lg px-2 py-1 text-xs font-medium">
                    Free
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Tech Conference 2024
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Join us for an exciting day of technology talks and
                  networking.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>March 15, 2024 at 9:00 AM</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>Tech Hub, Downtown</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    <span>120 registered</span>
                  </div>
                </div>
                <Button className="w-full">Register Now</Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section background="muted" padding="xl">
        <ContentWrapper variant="centered">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already creating and discovering
            amazing events in their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">Sign Up Now</Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </ContentWrapper>
      </Section>
    </MainLayout>
  );
}
