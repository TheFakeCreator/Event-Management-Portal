// Club related types and interfaces

export interface ClubSponsor {
  _id?: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
}

export interface ClubSocials {
  email?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  discord?: string;
}

export interface ClubGalleryItem {
  url: string;
  caption?: string;
  uploadedBy: string; // User ID
  uploadedAt: Date;
}

export interface Club {
  _id: string;
  name: string;
  description: string;
  about?: string;
  image?: string;
  banner?: string;
  domains: string[];
  sponsors: ClubSponsor[];
  recruitments: string[]; // Recruitment IDs
  social: ClubSocials;
  gallery: ClubGalleryItem[];
  events: string[]; // Event IDs
  currentOc: string[]; // User IDs (Organizing Committee)
  pastOc: string[]; // User IDs
  currentMembers: string[]; // User IDs
  pastMembers: string[]; // User IDs
  moderators: string[]; // User IDs
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClubRequest {
  name: string;
  description: string;
  about?: string;
  image?: string;
  banner?: string;
  domains?: string[];
  social?: ClubSocials;
}

export interface UpdateClubRequest {
  name?: string;
  description?: string;
  about?: string;
  image?: string;
  banner?: string;
  domains?: string[];
  social?: ClubSocials;
}

export interface AddClubMemberRequest {
  userId: string;
  role: 'currentOc' | 'currentMember' | 'moderator';
}

export interface AddClubGalleryItemRequest {
  url: string;
  caption?: string;
}

// Club request interfaces for controller operations
export interface ClubCreateRequest {
  name: string;
  description: string;
  image: string;
  oc?: string;
}

export interface ClubEditRequest {
  name: string;
  description: string;
  about: string;
  image: string;
  banner: string;
}

export interface ClubAboutEditRequest {
  about: string;
}

export interface ClubSponsorRequest {
  name: string;
  logo: string;
  description: string;
  website: string;
}

// Extended Club interface with populated data for views
export interface ClubWithData extends Club {
  activeRecruitments?: any[];
  pastRecruitments?: any[];
  activeEvents?: any[];
  pastEvents?: any[];
}
