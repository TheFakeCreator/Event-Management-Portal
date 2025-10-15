// Event related types and interfaces

export type EventType =
  | 'Workshops'
  | 'Talks'
  | 'Workshops & Talks'
  | 'Meetups'
  | 'Networking'
  | 'Fun'
  | 'Tech'
  | 'Other';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface EventLocation {
  venue: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface EventAttendance {
  userId: string;
  registeredAt: Date;
  attended?: boolean;
  feedback?: string;
}

export interface EventSponsor {
  name: string;
  logo?: string;
  description?: string;
  website?: string;
}

export interface EventWinner {
  position: string; // "1st Place", "2nd Place", "Best Team", etc.
  name: string;
  description?: string; // Achievement description
  prize?: string; // Prize details
}

export type EventReportReason =
  | 'inappropriate_content'
  | 'misleading_information'
  | 'unauthorized_collaboration'
  | 'spam'
  | 'other';

export type EventReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface EventReport {
  reportedBy: string; // User ID
  reason: EventReportReason;
  description: string;
  reportedAt: Date;
  status: EventReportStatus;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  Type: EventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  image: string;
  club?: string; // Club ID
  collaborators: string[]; // Club IDs
  registeredUsers: number;
  sponsors: EventSponsor[];
  winners: EventWinner[];
  eventLeads: string[]; // User IDs
  preEventNotes?: string;
  postEventNotes?: string;
  reports: EventReport[];
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  Type: EventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  image?: string;
  organizerClub?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
  tags?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  Type?: EventType;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  image?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
  tags?: string[];
  status?: EventStatus;
}

export interface EventFilterOptions {
  type?: EventType;
  status?: EventStatus;
  organizerClub?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  isPublic?: boolean;
}
