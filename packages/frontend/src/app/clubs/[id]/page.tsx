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
  Users,
  MapPin,
  Calendar,
  Trophy,
  ExternalLink,
  Share2,
  Heart,
  Edit3,
  Trash2,
  UserPlus,
  UserMinus,
  MessageSquare,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  ChevronLeft,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

// Mock club data (this would come from API)
const mockClub = {
  _id: '1',
  name: 'Tech Enthusiasts Club',
  description:
    'A community of passionate developers and tech enthusiasts exploring the latest technologies, sharing knowledge, and building innovative projects together.',
  longDescription:
    "Welcome to the Tech Enthusiasts Club, where innovation meets collaboration! Our community brings together developers, designers, entrepreneurs, and tech lovers from all backgrounds to explore the ever-evolving world of technology.\n\n**Our Mission:**\nTo create an inclusive environment where members can learn, grow, and contribute to the tech community through knowledge sharing, collaborative projects, and networking opportunities.\n\n**What We Do:**\n\n• **Weekly Workshops**: Hands-on sessions covering the latest technologies and frameworks\n• **Hackathons**: Collaborative coding events to build innovative solutions\n• **Tech Talks**: Industry experts share insights and experiences\n• **Open Source Projects**: Contribute to meaningful projects that make a difference\n• **Networking Events**: Connect with like-minded individuals and industry professionals\n• **Mentorship Programs**: Pair experienced developers with newcomers\n\n**Our Community:**\nWith over 127 active members, we represent a diverse group of individuals united by our passion for technology. From beginners taking their first steps in programming to seasoned professionals leading major projects, everyone has something valuable to contribute.\n\n**Join Us:**\nWhether you're looking to learn new skills, share your expertise, or simply connect with fellow tech enthusiasts, the Tech Enthusiasts Club is your gateway to an amazing community. Join us and be part of something bigger!",
  logo: '/images/clubs/tech-club.jpg',
  coverImage: '/images/clubs/tech-club-cover.jpg',
  category: 'technology',
  memberCount: 127,
  location: 'Downtown',
  address: '123 Tech Street, Downtown, San Francisco, CA 94102',
  established: '2018',
  website: 'https://techclub.example.com',
  socialLinks: {
    instagram: '@techclub',
    twitter: '@techclub',
    linkedin: 'techclub',
  },
  achievements: [
    'Best Tech Club 2023',
    'Innovation Award 2022',
    'Community Impact Award 2021',
    'Most Active Club 2020',
  ],
  isActive: true,
  featured: true,
  tags: ['Technology', 'Programming', 'Innovation', 'Community', 'Learning'],
  stats: {
    totalEvents: 45,
    upcomingEvents: 3,
    totalProjects: 12,
    activeProjects: 4,
  },
  leadership: [
    {
      _id: 'leader1',
      name: 'Sarah Chen',
      role: 'President',
      avatar: '/images/avatars/sarah.jpg',
      bio: 'Full-stack developer with 8 years of experience in React and Node.js',
    },
    {
      _id: 'leader2',
      name: 'Mike Johnson',
      role: 'Vice President',
      avatar: '/images/avatars/mike.jpg',
      bio: 'DevOps engineer passionate about cloud infrastructure and automation',
    },
    {
      _id: 'leader3',
      name: 'Lisa Wong',
      role: 'Events Coordinator',
      avatar: '/images/avatars/lisa.jpg',
      bio: 'UX designer and community organizer with a love for inclusive events',
    },
  ],
  upcomingEvents: [
    {
      _id: 'event1',
      title: 'React Next.js Workshop',
      date: '2025-10-20',
      time: '14:00',
      registeredCount: 23,
      maxParticipants: 50,
    },
    {
      _id: 'event2',
      title: 'AI/ML Study Group',
      date: '2025-10-25',
      time: '18:00',
      registeredCount: 15,
      maxParticipants: 30,
    },
    {
      _id: 'event3',
      title: 'Open Source Contribution Day',
      date: '2025-10-30',
      time: '10:00',
      registeredCount: 8,
      maxParticipants: 20,
    },
  ],
  gallery: [
    {
      url: '/images/gallery/tech1.jpg',
      caption: 'Annual Hackathon 2023',
    },
    {
      url: '/images/gallery/tech2.jpg',
      caption: 'Workshop on React Hooks',
    },
    {
      url: '/images/gallery/tech3.jpg',
      caption: 'Team Building Event',
    },
    {
      url: '/images/gallery/tech4.jpg',
      caption: 'Guest Speaker Session',
    },
  ],
  rules: [
    'Be respectful and inclusive to all members',
    'No spam or self-promotion without approval',
    'Attend at least 2 events per month to maintain active status',
    'Contribute to at least one community project annually',
    'Help newcomers feel welcome and supported',
  ],
  membershipTiers: [
    {
      name: 'Regular Member',
      description: 'Access to all events and community resources',
      price: 0,
      benefits: ['Event access', 'Community Discord', 'Resource library'],
    },
    {
      name: 'Premium Member',
      description: 'Additional perks and priority access',
      price: 25,
      benefits: [
        'All regular benefits',
        'Priority event registration',
        '1-on-1 mentoring',
        'Exclusive workshops',
      ],
    },
  ],
  createdAt: '2018-03-15T10:00:00Z',
  updatedAt: '2024-01-12T15:30:00Z',
};

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [club, setClub] = useState(mockClub);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'about' | 'events' | 'gallery' | 'members'
  >('about');

  const clubId = params.id as string;

  useEffect(() => {
    // TODO: Fetch club data from API
    // fetchClub(clubId)

    // Mock: Check if user is a member
    setIsMember(false); // This would come from API
    setIsFavorited(false); // This would come from API
  }, [clubId]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?returnUrl=/clubs/${clubId}`);
      return;
    }

    setJoining(true);
    try {
      // TODO: API call to join club
      console.log('Joining club:', clubId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsMember(true);
      setClub((prev) => ({
        ...prev,
        memberCount: prev.memberCount + 1,
      }));
    } catch (error) {
      console.error('Join failed:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setJoining(true);
    try {
      // TODO: API call to leave club
      console.log('Leaving club:', clubId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsMember(false);
      setClub((prev) => ({
        ...prev,
        memberCount: prev.memberCount - 1,
      }));
    } catch (error) {
      console.error('Leave failed:', error);
    } finally {
      setJoining(false);
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
        title: club.name,
        text: club.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const breadcrumbItems = [
    { label: 'Clubs', href: ROUTES.CLUBS },
    { label: club.name, href: `/clubs/${clubId}`, current: true },
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

          {/* Hero Section */}
          <div className="relative">
            {club.coverImage && (
              <div className="h-64 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                <img
                  src={club.coverImage}
                  alt={`${club.name} cover`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-12 relative z-10 bg-background md:bg-transparent p-6 md:p-0 rounded-lg md:rounded-none">
              <div className="flex items-center gap-6">
                {club.logo ? (
                  <img
                    src={club.logo}
                    alt={`${club.name} logo`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-background"
                    onError={(e) => {
                      e.currentTarget.src = '/images/default-club.svg';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-background">
                    <span className="text-white font-bold text-2xl">
                      {club.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">{club.name}</h1>
                    {club.featured && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        Featured
                      </Badge>
                    )}
                    {!club.isActive && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{club.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{club.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Est. {club.established}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{club.category}</Badge>
                    {club.achievements && club.achievements.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Trophy className="w-4 h-4" />
                        <span>{club.achievements.length} achievements</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 md:ml-auto">
                {isAuthenticated ? (
                  isMember ? (
                    <Button
                      onClick={handleLeave}
                      disabled={joining}
                      variant="outline"
                    >
                      {joining ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Leaving...
                        </>
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Leave Club
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleJoin} disabled={joining}>
                      {joining ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join Club
                        </>
                      )}
                    </Button>
                  )
                ) : (
                  <Button asChild>
                    <Link href={`${ROUTES.LOGIN}?returnUrl=/clubs/${clubId}`}>
                      Sign In to Join
                    </Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFavorite}
                  disabled={!isAuthenticated}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorited ? 'fill-current text-red-500' : ''}`}
                  />
                </Button>

                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {club.stats.totalEvents}
              </div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {club.stats.upcomingEvents}
              </div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {club.stats.totalProjects}
              </div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {club.stats.activeProjects}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8">
              {[
                { id: 'about', label: 'About' },
                { id: 'events', label: 'Events' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'members', label: 'Members' },
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      About {club.name}
                    </h2>
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground whitespace-pre-line">
                        {club.longDescription}
                      </p>
                    </div>
                  </div>

                  {club.tags && club.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {club.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {club.achievements && club.achievements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Achievements
                      </h3>
                      <div className="space-y-2">
                        {club.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span>{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {club.rules && club.rules.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Club Rules</h3>
                      <ul className="space-y-2">
                        {club.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Upcoming Events</h2>
                    <Button size="sm" asChild>
                      <Link href={`${ROUTES.EVENTS}?club=${clubId}`}>
                        View All Events
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {club.upcomingEvents.map((event) => (
                      <Card key={event._id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="font-semibold">
                              <Link
                                href={`${ROUTES.EVENTS}/${event._id}`}
                                className="hover:text-primary"
                              >
                                {event.title}
                              </Link>
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatDate(event.date)}</span>
                              <span>{event.time}</span>
                              <span>
                                {event.registeredCount}/{event.maxParticipants}{' '}
                                registered
                              </span>
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`${ROUTES.EVENTS}/${event._id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Photo Gallery</h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {club.gallery.map((photo, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src =
                              '/images/placeholder-image.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
                          <p className="text-white text-sm p-3">
                            {photo.caption}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Leadership Team</h2>

                  <div className="space-y-4">
                    {club.leadership.map((leader) => (
                      <Card key={leader._id} className="p-4">
                        <div className="flex items-start gap-4">
                          {leader.avatar ? (
                            <img
                              src={leader.avatar}
                              alt={leader.name}
                              className="w-16 h-16 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  '/images/default-avatar.svg';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold text-lg">
                                {leader.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{leader.name}</h3>
                              <Badge variant="secondary">{leader.role}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              {leader.bio}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Club
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`${ROUTES.EVENTS}?club=${clubId}`}>
                      <Calendar className="w-4 h-4 mr-2" />
                      View Events
                    </Link>
                  </Button>
                  {club.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                </div>
              </Card>

              {/* Social Links */}
              {club.socialLinks && Object.keys(club.socialLinks).length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Follow Us</h3>
                  <div className="space-y-2">
                    {club.socialLinks.instagram && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href={`https://instagram.com/${club.socialLinks.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          {club.socialLinks.instagram}
                        </a>
                      </Button>
                    )}
                    {club.socialLinks.twitter && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href={`https://twitter.com/${club.socialLinks.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter className="w-4 h-4 mr-2" />
                          {club.socialLinks.twitter}
                        </a>
                      </Button>
                    )}
                    {club.socialLinks.linkedin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href={`https://linkedin.com/company/${club.socialLinks.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Membership Tiers */}
              {club.membershipTiers && club.membershipTiers.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Membership Options</h3>
                  <div className="space-y-4">
                    {club.membershipTiers.map((tier, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{tier.name}</h4>
                          <div className="text-lg font-bold">
                            {tier.price === 0 ? 'Free' : `$${tier.price}`}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {tier.description}
                        </p>
                        <ul className="text-xs space-y-1">
                          {tier.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-primary rounded-full" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Admin Actions */}
              {user && (user.role === 'admin' || isMember) && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Manage Club</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link href={`/clubs/${clubId}/edit`}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Club
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Members
                    </Button>
                    {user?.role === 'admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Club
                      </Button>
                    )}
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
