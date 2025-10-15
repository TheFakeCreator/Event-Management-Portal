// Event Registration related types and interfaces

export interface EventRegistration {
  _id: string;
  event: string; // Event ID
  name: string;
  email: string;
  phone: string;
  user?: string; // User ID (optional for guest registrations)
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRegistrationRequest {
  event: string; // Event ID
  name: string;
  email: string;
  phone: string;
  user?: string; // User ID
}

export interface UpdateEventRegistrationRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface EventRegistrationFilterOptions {
  event?: string;
  user?: string;
  email?: string;
  phone?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EventRegistrationStats {
  total: number;
  byEvent: { [eventId: string]: number };
  recent: number; // Last 7 days
  guestRegistrations: number; // Registrations without user ID
  userRegistrations: number; // Registrations with user ID
}
