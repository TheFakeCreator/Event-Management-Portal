'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout, PageWrapper } from '@/components/layout';
import { ClubCard, ClubFilters } from '@/components/clubs';
import { Button } from '@/components/ui/button';
import { Plus, Users, Grid, List } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

// Mock club data (this would come from API)
const mockClubs = [
  {
    _id: '1',
    name: 'Tech Enthusiasts Club',
    description:
      'A community of passionate developers and tech enthusiasts exploring the latest technologies, sharing knowledge, and building innovative projects together.',
    logo: '/images/clubs/tech-club.jpg',
    category: 'technology',
    memberCount: 127,
    location: 'Downtown',
    established: '2018',
    website: 'https://techclub.example.com',
    socialLinks: {
      instagram: '@techclub',
      twitter: '@techclub',
      linkedin: 'techclub',
    },
    achievements: [
      'Best Tech Club 2023',
      'Innovation Award',
      'Community Impact Award',
    ],
    isActive: true,
    featured: true,
  },
  {
    _id: '2',
    name: 'Arts & Culture Society',
    description:
      'Celebrating creativity through various art forms including painting, sculpture, music, and performance arts. Join us for exhibitions, workshops, and cultural events.',
    category: 'arts',
    memberCount: 89,
    location: 'Campus',
    established: '2015',
    website: 'https://artsclub.example.com',
    achievements: ['Art Exhibition 2023', 'Cultural Heritage Award'],
    isActive: true,
    featured: true,
  },
  {
    _id: '3',
    name: 'Entrepreneur Society',
    description:
      'Supporting aspiring entrepreneurs with mentorship, networking opportunities, and resources to turn innovative ideas into successful businesses.',
    category: 'business',
    memberCount: 156,
    location: 'Downtown',
    established: '2019',
    website: 'https://entrepreneurclub.example.com',
    socialLinks: {
      linkedin: 'entrepreneur-society',
      twitter: '@entrepreneursoc',
    },
    achievements: ['Startup Incubator Award', 'Best Business Network'],
    isActive: true,
  },
  {
    _id: '4',
    name: 'Wellness Club',
    description:
      'Promoting physical and mental well-being through yoga, meditation, fitness activities, and wellness workshops for a balanced lifestyle.',
    category: 'health',
    memberCount: 78,
    location: 'Uptown',
    established: '2020',
    achievements: ['Community Wellness Award'],
    isActive: true,
  },
  {
    _id: '5',
    name: 'Gaming Community',
    description:
      'A vibrant community of gamers organizing tournaments, game nights, and discussions about the latest games and gaming technology.',
    category: 'hobby',
    memberCount: 203,
    location: 'Online',
    established: '2017',
    website: 'https://gamingclub.example.com',
    socialLinks: {
      instagram: '@gamingcommunity',
      twitter: '@gamingclub',
    },
    achievements: ['E-sports Championship', 'Best Gaming Community'],
    isActive: true,
  },
  {
    _id: '6',
    name: 'Environmental Action Group',
    description:
      'Dedicated to environmental conservation and sustainability initiatives. Join us in making a positive impact on our planet through action and awareness.',
    category: 'community',
    memberCount: 67,
    location: 'Campus',
    established: '2016',
    achievements: ['Green Initiative Award'],
    isActive: true,
  },
  {
    _id: '7',
    name: 'Photography Society',
    description:
      'Capturing moments and exploring the art of photography through workshops, photo walks, and exhibitions showcasing member work.',
    category: 'arts',
    memberCount: 45,
    location: 'Downtown',
    established: '2021',
    isActive: false,
  },
  {
    _id: '8',
    name: 'Book Lovers Club',
    description:
      'A cozy community for literature enthusiasts sharing book recommendations, hosting reading sessions, and discussing literary works.',
    category: 'education',
    memberCount: 34,
    location: 'Suburbs',
    established: '2022',
    isActive: true,
  },
];

export default function ClubsPage() {
  const { isAuthenticated } = useAuth();
  const [clubs] = useState(mockClubs);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberCountFilter, setMemberCountFilter] = useState('all');

  // Filter clubs based on current filters
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      // Search term filter
      if (
        searchTerm &&
        !club.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !club.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (
        selectedCategory &&
        selectedCategory !== 'all' &&
        club.category !== selectedCategory
      ) {
        return false;
      }

      // Location filter
      if (
        selectedLocation &&
        selectedLocation !== 'all' &&
        club.location.toLowerCase() !== selectedLocation.toLowerCase()
      ) {
        return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'active' && !club.isActive) return false;
        if (statusFilter === 'inactive' && club.isActive) return false;
      }

      // Member count filter
      if (memberCountFilter && memberCountFilter !== 'all') {
        const count = club.memberCount;
        if (memberCountFilter === '1-10' && (count < 1 || count > 10))
          return false;
        if (memberCountFilter === '11-50' && (count < 11 || count > 50))
          return false;
        if (memberCountFilter === '51-100' && (count < 51 || count > 100))
          return false;
        if (memberCountFilter === '101-500' && (count < 101 || count > 500))
          return false;
        if (memberCountFilter === '500+' && count < 500) return false;
      }

      return true;
    });
  }, [
    clubs,
    searchTerm,
    selectedCategory,
    selectedLocation,
    statusFilter,
    memberCountFilter,
  ]);

  // Count active filters (exclude 'all' values)
  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all' ? selectedCategory : '',
    selectedLocation !== 'all' ? selectedLocation : '',
    statusFilter !== 'all' ? statusFilter : '',
    memberCountFilter !== 'all' ? memberCountFilter : '',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setStatusFilter('all');
    setMemberCountFilter('all');
  };

  // Sort clubs to show featured first, then by member count
  const sortedClubs = [...filteredClubs].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.memberCount - a.memberCount;
  });

  return (
    <MainLayout>
      <PageWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clubs</h1>
              <p className="text-muted-foreground">
                Join communities that match your interests and passions
              </p>
            </div>

            {isAuthenticated && (
              <Button asChild>
                <Link href={ROUTES.CREATE_CLUB}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Club
                </Link>
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Total Clubs</span>
              </div>
              <p className="text-2xl font-bold mt-1">{clubs.length}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Active Clubs</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {clubs.filter((club) => club.isActive).length}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Total Members</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {clubs.reduce((sum, club) => sum + club.memberCount, 0)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <ClubFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            memberCountFilter={memberCountFilter}
            onMemberCountFilterChange={setMemberCountFilter}
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* View Toggle & Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {sortedClubs.length} club{sortedClubs.length !== 1 ? 's' : ''}{' '}
              found
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Clubs Grid/List */}
          {sortedClubs.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
              }
            >
              {sortedClubs.map((club) => (
                <ClubCard key={club._id} club={club} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Load More (for pagination) */}
          {sortedClubs.length > 0 && (
            <div className="text-center pt-8">
              <Button variant="outline" size="lg">
                Load More Clubs
              </Button>
            </div>
          )}
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
