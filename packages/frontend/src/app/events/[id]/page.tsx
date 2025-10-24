'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout, PageWrapper } from '@/components/layout';
import { Breadcrumbs } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Share2,
  Heart,
  ExternalLink,
  Edit3,
  Trash2,
  UserPlus,
  MessageSquare,
  Star,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

// Mock event data (this would come from API)
const mockEvent = {
  _id: '1',
  title: 'React Next.js Workshop',
  description:
    "Learn modern React development with Next.js framework. Build full-stack applications with server-side rendering and API routes.\n\nThis comprehensive workshop will cover:\n\n• Next.js fundamentals and App Router\n• Server-side rendering and static generation\n• API routes and backend integration\n• Authentication with NextAuth.js\n• Deployment strategies\n• Performance optimization\n\nWhether you're a beginner looking to get started with React or an experienced developer wanting to learn Next.js, this workshop is designed to give you practical, hands-on experience.",
  longDescription:
    "This intensive workshop is designed for developers who want to master modern React development using the Next.js framework. Over the course of 6 hours, participants will build a complete full-stack application from scratch.\n\n**What You'll Learn:**\n\n• **Next.js Fundamentals**: Understanding the App Router, file-based routing, and project structure\n• **Server-Side Rendering**: Implementing SSR, SSG, and ISR for optimal performance\n• **API Development**: Creating robust API routes and handling data\n• **Authentication**: Implementing secure authentication with NextAuth.js\n• **Database Integration**: Connecting to databases and handling data persistence\n• **Styling**: Modern styling approaches with Tailwind CSS\n• **Deployment**: Deploying applications to Vercel and other platforms\n• **Performance**: Optimization techniques and best practices\n\n**Workshop Format:**\n\nThe workshop follows a hands-on approach with live coding sessions, interactive exercises, and Q&A segments. Each participant will have access to the complete source code and additional resources.\n\n**Prerequisites:**\n\n• Basic JavaScript knowledge\n• Familiarity with React fundamentals\n• Node.js installed on your machine\n• Code editor (VS Code recommended)\n\n**What's Included:**\n\n• All workshop materials and source code\n• Access to private Discord channel for ongoing support\n• Certificate of completion\n• 30-day email support\n• Bonus resources and cheat sheets",
  date: '2025-10-20',
  time: '14:00',
  endTime: '20:00',
  location: 'Tech Hub, Downtown',
  address: '123 Tech Street, Downtown, San Francisco, CA 94102',
  category: 'technology',
  price: 0,
  currency: 'USD',
  maxParticipants: 50,
  registeredParticipants: 23,
  featured: true,
  status: 'upcoming',
  tags: ['React', 'Next.js', 'JavaScript', 'Web Development', 'Frontend'],
  images: [
    '/images/events/react-workshop-1.jpg',
    '/images/events/react-workshop-2.jpg',
  ],
  organizer: {
    _id: 'org1',
    name: 'John Smith',
    email: 'john@techclub.com',
    avatar: '/images/avatars/john.jpg',
  },
  club: {
    _id: 'club1',
    name: 'Tech Enthusiasts Club',
    logo: '/images/clubs/tech-club.jpg',
    memberCount: 127,
  },
  requirements: [
    'Laptop with Node.js installed',
    'Basic JavaScript knowledge',
    'Code editor (VS Code recommended)',
    'Stable internet connection',
  ],
  agenda: [
    {
      time: '14:00 - 14:30',
      title: 'Welcome & Introduction',
      description:
        'Getting to know each other and setting up the development environment',
    },
    {
      time: '14:30 - 16:00',
      title: 'Next.js Fundamentals',
      description:
        'Understanding the framework, App Router, and basic concepts',
    },
    {
      time: '16:00 - 16:15',
      title: 'Break',
      description: 'Coffee break and networking',
    },
    {
      time: '16:15 - 17:45',
      title: 'Building the Application',
      description: 'Hands-on coding session building a real application',
    },
    {
      time: '17:45 - 18:00',
      title: 'Break',
      description: 'Short break',
    },
    {
      time: '18:00 - 19:30',
      title: 'Advanced Features',
      description: 'Authentication, API routes, and database integration',
    },
    {
      time: '19:30 - 20:00',
      title: 'Q&A & Wrap-up',
      description: 'Questions, feedback, and next steps',
    },
  ],
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-12T15:30:00Z',
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(mockEvent);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'agenda' | 'requirements'
  >('overview');

  const eventId = params.id as string;

  useEffect(() => {
    // TODO: Fetch event data from API
    // fetchEvent(eventId)

    // Mock: Check if user is registered
    setIsRegistered(false); // This would come from API
    setIsFavorited(false); // This would come from API
  }, [eventId]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?returnUrl=/events/${eventId}`);
      return;
    }

    setRegistering(true);
    try {
      // TODO: API call to register for event
      console.log('Registering for event:', eventId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsRegistered(true);
      setEvent((prev) => ({
        ...prev,
        registeredParticipants: prev.registeredParticipants + 1,
      }));
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    setRegistering(true);
    try {
      // TODO: API call to unregister from event
      console.log('Unregistering from event:', eventId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsRegistered(false);
      setEvent((prev) => ({
        ...prev,
        registeredParticipants: prev.registeredParticipants - 1,
      }));
    } catch (error) {
      console.error('Unregistration failed:', error);
    } finally {
      setRegistering(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) return;

    try {
      // TODO: API call to toggle favorite
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isEventFull = event.registeredParticipants >= event.maxParticipants;
  const spotsLeft = event.maxParticipants - event.registeredParticipants;

  const breadcrumbItems = [
    { label: 'Events', href: ROUTES.EVENTS },
    { label: event.title, href: `/events/${eventId}`, current: true },
  ];

  if (loading) {
    return (
      <MainLayout>
        <PageWrapper>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </PageWrapper>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageWrapper>
        <div className="space-y-6">
          {/* Breadcrumbs & Back Button */}
          <div className="flex items-center justify-between">
            <Breadcrumbs items={breadcrumbItems} />
            <Button variant="outline" onClick={() => router.back()}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Section */}
              <div className="space-y-4">
                {event.images && event.images.length > 0 && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={event.images[0]}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-event.svg';
                      }}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.category}</Badge>
                    {event.featured && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        Featured
                      </Badge>
                    )}
                    <Badge
                      variant={
                        event.status === 'upcoming' ? 'default' : 'secondary'
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight">
                    {event.title}
                  </h1>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(event.time)} - {formatTime(event.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b">
                <nav className="flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'agenda', label: 'Agenda' },
                    { id: 'requirements', label: 'Requirements' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        About This Event
                      </h2>
                      <div className="prose max-w-none">
                        <p className="text-muted-foreground whitespace-pre-line">
                          {event.longDescription || event.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Event Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Duration:
                          </span>
                          <span>6 hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Language:
                          </span>
                          <span>English</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Category:
                          </span>
                          <span className="capitalize">{event.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Address:
                          </span>
                          <span className="text-right">{event.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'agenda' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Event Agenda</h2>
                    <div className="space-y-4">
                      {event.agenda.map((item, index) => (
                        <div
                          key={index}
                          className="flex gap-4 p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="text-sm font-medium text-primary min-w-[120px]">
                            {item.time}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      What You Need
                    </h2>
                    <ul className="space-y-2">
                      {event.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    {event.price === 0 ? (
                      <div className="text-2xl font-bold text-green-600">
                        Free
                      </div>
                    ) : (
                      <div className="text-2xl font-bold">
                        ${event.price} {event.currency}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.registeredParticipants} / {event.maxParticipants}{' '}
                        registered
                      </span>
                    </div>
                    {spotsLeft > 0 && spotsLeft <= 10 && (
                      <div className="text-orange-600 mt-1">
                        Only {spotsLeft} spots left!
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {isAuthenticated ? (
                      isRegistered ? (
                        <Button
                          onClick={handleUnregister}
                          disabled={registering}
                          variant="outline"
                          className="w-full"
                        >
                          {registering ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Unregistering...
                            </>
                          ) : (
                            'Unregister'
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRegister}
                          disabled={registering || isEventFull}
                          className="w-full"
                        >
                          {registering ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Registering...
                            </>
                          ) : isEventFull ? (
                            'Event Full'
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Register Now
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <Button asChild className="w-full">
                        <Link
                          href={`${ROUTES.LOGIN}?returnUrl=/events/${eventId}`}
                        >
                          Sign In to Register
                        </Link>
                      </Button>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleFavorite}
                        disabled={!isAuthenticated}
                      >
                        <Heart
                          className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`}
                        />
                        {isFavorited ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Organizer Card */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Organizer</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {event.organizer.avatar ? (
                      <img
                        src={event.organizer.avatar}
                        alt={event.organizer.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-avatar.svg';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {event.organizer.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{event.organizer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Event Organizer
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Organizer
                  </Button>
                </div>
              </Card>

              {/* Club Card */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Hosted by</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {event.club.logo ? (
                      <img
                        src={event.club.logo}
                        alt={event.club.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-club.svg';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {event.club.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{event.club.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.club.memberCount} members
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`${ROUTES.CLUBS}/${event.club._id}`}>
                      View Club
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Admin Actions */}
              {user &&
                (user.role === 'admin' || user.id === event.organizer._id) && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Manage Event</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/events/${eventId}/edit`}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Event
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Users className="w-4 h-4 mr-2" />
                        View Registrations
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Event
                      </Button>
                    </div>
                  </Card>
                )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
