'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout, PageWrapper } from '@/components/layout';
import { EventCard, EventFilters } from '@/components/events';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Grid, List, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';

interface EventFiltersState {
  search: string;
  category: string;
  dateRange: string;
  priceRange: string;
  location: string;
  sortBy: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<EventFiltersState>({
    search: '',
    category: 'all',
    dateRange: 'all',
    priceRange: 'all',
    location: 'all',
    sortBy: 'date',
  });

  // API query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};

    if (filters.search) params.search = filters.search;
    if (filters.category && filters.category !== 'all')
      params.category = filters.category;
    if (filters.dateRange && filters.dateRange !== 'all') {
      // Convert dateRange to startDate/endDate based on selection
      const today = new Date();
      switch (filters.dateRange) {
        case 'today':
          params.startDate = today.toISOString().split('T')[0];
          params.endDate = today.toISOString().split('T')[0];
          break;
        case 'thisWeek':
          const weekStart = new Date(
            today.setDate(today.getDate() - today.getDay())
          );
          const weekEnd = new Date(
            today.setDate(today.getDate() - today.getDay() + 6)
          );
          params.startDate = weekStart.toISOString().split('T')[0];
          params.endDate = weekEnd.toISOString().split('T')[0];
          break;
        case 'thisMonth':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
          );
          params.startDate = monthStart.toISOString().split('T')[0];
          params.endDate = monthEnd.toISOString().split('T')[0];
          break;
      }
    }

    return params;
  }, [filters]);

  // Fetch events using the custom hook
  const {
    data: eventsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useEvents(queryParams);

  const events = eventsResponse?.events || [];
  const pagination = eventsResponse?.pagination;

  // Count active filters (exclude 'all' values)
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== 'all'
  ).length;

  const handleFilterChange = (key: keyof EventFiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      dateRange: 'all',
      priceRange: 'all',
      location: 'all',
      sortBy: 'date',
    });
  };

  if (isError) {
    return (
      <MainLayout>
        <PageWrapper>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load events
            </h3>
            <p className="text-muted-foreground mb-4">
              {error?.message || 'Something went wrong while fetching events'}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </PageWrapper>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Events</h1>
              <p className="text-muted-foreground">
                Discover amazing events happening in your community
              </p>
            </div>

            {user && (
              <Button asChild>
                <Link href={ROUTES.CREATE_EVENT}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>

          {/* Filters */}
          <EventFilters
            searchTerm={filters.search}
            onSearchChange={(value) => handleFilterChange('search', value)}
            selectedCategory={filters.category}
            onCategoryChange={(value) => handleFilterChange('category', value)}
            selectedLocation={filters.location}
            onLocationChange={(value) => handleFilterChange('location', value)}
            priceFilter={filters.priceRange}
            onPriceFilterChange={(value) =>
              handleFilterChange('priceRange', value)
            }
            dateFilter={filters.dateRange}
            onDateFilterChange={(value) =>
              handleFilterChange('dateRange', value)
            }
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* View Toggle & Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading events...
                </span>
              ) : (
                `${events.length} event${events.length !== 1 ? 's' : ''} found`
              )}
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

          {/* Events Grid/List */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-4'
              }
            >
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={() => {}} // Will be implemented with useRegisterForEvent hook
                  isLoading={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center pt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
