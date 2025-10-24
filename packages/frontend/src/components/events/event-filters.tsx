import React from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { SimpleSelect } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface EventFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  priceFilter: string;
  onPriceFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'networking', label: 'Networking' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Conference' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  { value: 'online', label: 'Online' },
  { value: 'new-york', label: 'New York' },
  { value: 'san-francisco', label: 'San Francisco' },
  { value: 'los-angeles', label: 'Los Angeles' },
  { value: 'chicago', label: 'Chicago' },
  { value: 'boston', label: 'Boston' },
  { value: 'seattle', label: 'Seattle' },
  { value: 'austin', label: 'Austin' },
  { value: 'miami', label: 'Miami' },
];

const priceOptions = [
  { value: 'all', label: 'Any Price' },
  { value: 'free', label: 'Free' },
  { value: '0-25', label: 'Under $25' },
  { value: '25-50', label: '$25 - $50' },
  { value: '50-100', label: '$50 - $100' },
  { value: '100+', label: '$100+' },
];

const dateOptions = [
  { value: 'all', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'next-month', label: 'Next Month' },
];

export function EventFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  priceFilter,
  onPriceFilterChange,
  dateFilter,
  onDateFilterChange,
  onClearFilters,
  activeFiltersCount,
}: EventFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="w-full">
        <SearchInput
          placeholder="Search events..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4">
        {/* Category Filter */}
        <div className="min-w-48">
          <SimpleSelect
            options={categoryOptions}
            value={selectedCategory}
            onValueChange={onCategoryChange}
            placeholder="Category"
          />
        </div>

        {/* Location Filter */}
        <div className="min-w-48">
          <SimpleSelect
            options={locationOptions}
            value={selectedLocation}
            onValueChange={onLocationChange}
            placeholder="Location"
          />
        </div>

        {/* Price Filter */}
        <div className="min-w-48">
          <SimpleSelect
            options={priceOptions}
            value={priceFilter}
            onValueChange={onPriceFilterChange}
            placeholder="Price"
          />
        </div>

        {/* Date Filter */}
        <div className="min-w-48">
          <SimpleSelect
            options={dateOptions}
            value={dateFilter}
            onValueChange={onDateFilterChange}
            placeholder="Date"
          />
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Active filters:</span>
          <Badge variant="secondary">
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}{' '}
            applied
          </Badge>
        </div>
      )}
    </div>
  );
}
