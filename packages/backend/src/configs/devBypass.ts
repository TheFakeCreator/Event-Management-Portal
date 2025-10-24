import { User as UserType } from '@event-management/shared';

// Development bypass configuration - ONLY for development environment
export interface DevUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  bio?: string;
  department?: string;
  year?: string;
  interests: string[];
}

// Predefined development users for testing
export const DEV_USERS: Record<string, DevUser> = {
  admin: {
    id: 'dev-admin-001',
    name: 'Dev Admin User',
    email: 'admin@dev.local',
    role: 'admin',
    isActive: true,
    isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    bio: 'Development admin user for testing administrative functions',
    department: 'Computer Science',
    year: '2024',
    interests: ['Development', 'Testing', 'Administration'],
  },
  moderator: {
    id: 'dev-mod-001',
    name: 'Dev Moderator User',
    email: 'moderator@dev.local',
    role: 'moderator',
    isActive: true,
    isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator',
    bio: 'Development moderator user for testing moderation functions',
    department: 'Information Technology',
    year: '2023',
    interests: ['Moderation', 'Community Management', 'Events'],
  },
  user: {
    id: 'dev-user-001',
    name: 'Dev Regular User',
    email: 'user@dev.local',
    role: 'user',
    isActive: true,
    isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    bio: 'Development regular user for testing user functions',
    department: 'Business Administration',
    year: '2025',
    interests: ['Events', 'Clubs', 'Networking'],
  },
  unverified: {
    id: 'dev-unverified-001',
    name: 'Dev Unverified User',
    email: 'unverified@dev.local',
    role: 'user',
    isActive: true,
    isVerified: false,
    bio: 'Development unverified user for testing verification flows',
    department: 'Engineering',
    year: '2024',
    interests: ['Testing', 'Development'],
  },
  inactive: {
    id: 'dev-inactive-001',
    name: 'Dev Inactive User',
    email: 'inactive@dev.local',
    role: 'user',
    isActive: false,
    isVerified: true,
    bio: 'Development inactive user for testing inactive user handling',
    department: 'Arts',
    year: '2023',
    interests: ['Art', 'Design'],
  },
};

// Development bypass configuration
export interface DevBypassConfig {
  enabled: boolean;
  defaultUser: keyof typeof DEV_USERS;
  allowUserSwitch: boolean;
  logBypassUsage: boolean;
  bypassHeader: string;
  userSwitchHeader: string;
}

export const DEV_BYPASS_CONFIG: DevBypassConfig = {
  enabled:
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_DEV_BYPASS === 'true',
  defaultUser: 'user',
  allowUserSwitch: true,
  logBypassUsage: true,
  bypassHeader: 'x-dev-bypass',
  userSwitchHeader: 'x-dev-user',
};

// Convert DevUser to UserType for consistency
export const convertDevUserToUserType = (devUser: DevUser): UserType => {
  return {
    _id: devUser.id,
    name: devUser.name,
    email: devUser.email,
    role: devUser.role as any,
    isVerified: devUser.isVerified,
    avatar:
      devUser.avatar ||
      'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    bio: devUser.bio,
    phone: '+1-555-0123',
    gender: 'other' as const,
    socials: {
      linkedin: '',
      github: '',
      behance: '',
    },
    clubs: [],
    moderatorClubs: [],
    createdEvents: [],
    participatedEvents: [],
    isDeleted: false,
    failedLoginAttempts: 0,
    lastPasswordChange: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserType;
};

export default {
  DEV_USERS,
  DEV_BYPASS_CONFIG,
  convertDevUserToUserType,
};
