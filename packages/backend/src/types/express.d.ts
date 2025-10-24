import { Request } from 'express';
import { User as UserType } from '@event-management/shared';

declare global {
  namespace Express {
    interface Request {
      userInfo?: UserType;
      isUserAuthenticated?: boolean;
      flash?: (type: string, message?: string) => string[] | void;
      devBypassInfo?: {
        enabled: boolean;
        userType: string;
        timestamp: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  userInfo: UserType;
  isUserAuthenticated: true;
}

export interface ClubModeratorRequest extends AuthenticatedRequest {
  userInfo: UserType;
  isUserAuthenticated: true;
  club?: any; // Populated by middleware
  isClubMod?: boolean; // Indicates if user is moderator of the specific club
}
