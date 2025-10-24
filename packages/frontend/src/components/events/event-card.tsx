import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, Star } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

interface EventCardProps {
  event: {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category: string;
    price: number;
    maxParticipants: number;
    registeredParticipants: number;
    image?: string;
    featured?: boolean;
    club?: {
      name: string;
      _id: string;
    };
  };
  onRegister?: (eventId: string) => void;
  isRegistered?: boolean;
  isLoading?: boolean;
}

export function EventCard({
  event,
  onRegister,
  isRegistered = false,
  isLoading = false,
}: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRegistrationStatus = () => {
    const spotsLeft = event.maxParticipants - event.registeredParticipants;
    if (spotsLeft <= 0)
      return { status: 'full', text: 'Full', color: 'destructive' };
    if (spotsLeft <= 5)
      return {
        status: 'limited',
        text: `${spotsLeft} spots left`,
        color: 'secondary',
      };
    return { status: 'available', text: 'Available', color: 'default' };
  };

  const registrationStatus = getRegistrationStatus();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Event Image */}
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/40 overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-primary/60" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {event.featured && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          <Badge variant="secondary" className="bg-background/90">
            {event.category}
          </Badge>
        </div>

        {/* Price */}
        <div className="absolute top-4 right-4">
          <Badge
            variant={event.price === 0 ? 'default' : 'secondary'}
            className={
              event.price === 0 ? 'bg-green-500 text-white' : 'bg-background/90'
            }
          >
            {event.price === 0 ? 'Free' : `$${event.price}`}
          </Badge>
        </div>
      </div>

      {/* Event Content */}
      <div className="p-6">
        <div className="space-y-3">
          {/* Event Title */}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Event Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>

            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatTime(event.time)}</span>
            </div>

            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>

            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                {event.registeredParticipants}/{event.maxParticipants}{' '}
                registered
              </span>
            </div>
          </div>

          {/* Club Info */}
          {event.club && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Organized by{' '}
                <Link
                  href={ROUTES.CLUB_DETAILS(event.club._id)}
                  className="text-primary hover:underline font-medium"
                >
                  {event.club.name}
                </Link>
              </p>
            </div>
          )}

          {/* Registration Status */}
          <div className="flex items-center justify-between pt-4">
            <Badge variant={registrationStatus.color as any}>
              {registrationStatus.text}
            </Badge>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.EVENT_DETAILS(event._id)}>View Details</Link>
              </Button>

              {!isRegistered && registrationStatus.status !== 'full' && (
                <Button
                  size="sm"
                  onClick={() => onRegister?.(event._id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </Button>
              )}

              {isRegistered && (
                <Badge variant="default" className="px-3 py-1">
                  Registered
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
