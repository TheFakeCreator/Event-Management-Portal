// Announcement related types and interfaces

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  postedBy: string; // User ID
  club?: string; // Club ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnnouncementRequest {
  title: string;
  message: string;
  club?: string; // Club ID
}

export interface UpdateAnnouncementRequest {
  title?: string;
  message?: string;
}

export interface AnnouncementFilterOptions {
  club?: string;
  postedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

// Controller request interfaces
export interface AnnouncementCreateRequest {
  title: string;
  message: string;
  clubId?: string;
}

export interface AnnouncementUpdateRequest {
  title: string;
  message: string;
  clubId?: string;
}

// Response interfaces with populated fields
export interface AnnouncementWithDetails
  extends Omit<Announcement, 'postedBy' | 'club'> {
  postedBy: {
    _id: string;
    name: string;
    email: string;
  };
  club?: {
    _id: string;
    name: string;
  };
}
