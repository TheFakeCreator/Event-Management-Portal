import React from 'react';
import { SearchInput } from '@/components/ui';
import { SimpleSelect } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'sports', label: 'Sports & Recreation' },
  { value: 'business', label: 'Business & Professional' },
  { value: 'education', label: 'Education & Academic' },
  { value: 'community', label: 'Community Service' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'hobby', label: 'Hobbies & Interests' },
  { value: 'networking', label: 'Networking' },
  { value: 'other', label: 'Other' },
];

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  { value: 'downtown', label: 'Downtown' },
  { value: 'campus', label: 'Campus' },
  { value: 'uptown', label: 'Uptown' },
  { value: 'suburbs', label: 'Suburbs' },
  { value: 'online', label: 'Online' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const memberCountOptions = [
  { value: 'all', label: 'Any Size' },
  { value: '1-10', label: '1-10 members' },
  { value: '11-50', label: '11-50 members' },
  { value: '51-100', label: '51-100 members' },
  { value: '101-500', label: '101-500 members' },
  { value: '500+', label: '500+ members' },
];

interface ClubFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  memberCountFilter: string;
  onMemberCountFilterChange: (value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export function ClubFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  statusFilter,
  onStatusFilterChange,
  memberCountFilter,
  onMemberCountFilterChange,
  onClearFilters,
  activeFiltersCount,
}: ClubFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="w-full">
        <SearchInput
          placeholder="Search clubs by name or description..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <SimpleSelect
            value={selectedCategory}
            onValueChange={onCategoryChange}
            options={categoryOptions}
            placeholder="Category"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <SimpleSelect
            value={selectedLocation}
            onValueChange={onLocationChange}
            options={locationOptions}
            placeholder="Location"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <SimpleSelect
            value={statusFilter}
            onValueChange={onStatusFilterChange}
            options={statusOptions}
            placeholder="Status"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <SimpleSelect
            value={memberCountFilter}
            onValueChange={onMemberCountFilterChange}
            options={memberCountOptions}
            placeholder="Member Count"
          />
        </div>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {selectedCategory && selectedCategory !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category:{' '}
              {
                categoryOptions.find((opt) => opt.value === selectedCategory)
                  ?.label
              }
              <button
                onClick={() => onCategoryChange('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-sm p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {selectedLocation && selectedLocation !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Location:{' '}
              {
                locationOptions.find((opt) => opt.value === selectedLocation)
                  ?.label
              }
              <button
                onClick={() => onLocationChange('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-sm p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {statusFilter && statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status:{' '}
              {statusOptions.find((opt) => opt.value === statusFilter)?.label}
              <button
                onClick={() => onStatusFilterChange('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-sm p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {memberCountFilter && memberCountFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Members:{' '}
              {
                memberCountOptions.find(
                  (opt) => opt.value === memberCountFilter
                )?.label
              }
              <button
                onClick={() => onMemberCountFilterChange('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-sm p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
