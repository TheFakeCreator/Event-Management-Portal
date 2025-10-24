import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Calendar, Trophy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface Club {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  category: string;
  memberCount: number;
  location: string;
  established: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  achievements?: string[];
  isActive: boolean;
  featured?: boolean;
}

interface ClubCardProps {
  club: Club;
  viewMode?: 'grid' | 'list';
}

export function ClubCard({ club, viewMode = 'grid' }: ClubCardProps) {
  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {club.logo ? (
            <img
              src={club.logo}
              alt={`${club.name} logo`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {club.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{club.name}</h3>
              {club.featured && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Featured
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {club.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {club.location}
              </span>
            </div>
          </div>
        </div>

        {!club.isActive && <Badge variant="destructive">Inactive</Badge>}
      </div>

      <p className="text-muted-foreground mt-3 line-clamp-2">
        {club.description}
      </p>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{club.category}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Est. {club.established}
          </span>
        </div>

        {club.achievements && club.achievements.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="w-3 h-3" />
            {club.achievements.length} achievements
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex gap-2">
          {club.website && (
            <Button variant="outline" size="sm" asChild>
              <a href={club.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>

        <Button size="sm" asChild>
          <Link href={`${ROUTES.CLUBS}/${club._id}`}>View Details</Link>
        </Button>
      </div>
    </>
  );

  if (viewMode === 'list') {
    return (
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-6">
          {club.logo ? (
            <img
              src={club.logo}
              alt={`${club.name} logo`}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {club.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xl">{club.name}</h3>
                {club.featured && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    Featured
                  </Badge>
                )}
                {!club.isActive && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>

              <Button size="sm" asChild>
                <Link href={`${ROUTES.CLUBS}/${club._id}`}>View Details</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-2 line-clamp-2">
              {club.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {club.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {club.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Est. {club.established}
              </span>
              {club.achievements && club.achievements.length > 0 && (
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {club.achievements.length} achievements
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{club.category}</Badge>
              </div>

              <div className="flex gap-2">
                {club.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={club.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">{cardContent}</Card>
  );
}
