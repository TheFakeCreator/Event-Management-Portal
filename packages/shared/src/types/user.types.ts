// User related types and interfaces

export type Gender = 'male' | 'female' | 'other';

export type UserRole = 'admin' | 'user' | 'member' | 'moderator';

export interface UserSocials {
  linkedin?: string;
  github?: string;
  behance?: string;
}

export interface UserClub {
  id: string;
  designation?: string;
}

export interface User {
  _id: string;
  googleId?: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  gender: Gender;
  avatar: string;
  bio?: string;
  phone?: string;
  socials: UserSocials;
  clubs: UserClub[];
  moderatorClubs: string[];
  createdEvents: string[];
  participatedEvents: string[];
  isVerified: boolean;
  verificationToken?: string;
  role: UserRole;
  roleRequest?: UserRole | null;
  lastLogin?: Date;
  resetToken?: string;
  expireToken?: Date;
  isDeleted: boolean;
  failedLoginAttempts: number;
  accountLockTime?: Date;
  lastPasswordChange: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  username?: string;
  email: string;
  password?: string;
  gender?: Gender;
  bio?: string;
  phone?: string;
  socials?: UserSocials;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  bio?: string;
  phone?: string;
  socials?: UserSocials;
  avatar?: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Admin request interfaces
export interface AssignRoleRequest {
  userId: string;
  role: UserRole;
}

export interface AdminClubCreateRequest {
  name: string;
  description: string;
  image: string;
}

export interface AdminClubEditRequest {
  name: string;
  description: string;
  about: string;
  image: string;
  banner: string;
  domains: string[] | string;
  social: {
    email?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    discord?: string;
  };
}

export interface ModeratorRequest {
  userId: string;
}
