import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@event-management/shared';
import { Types } from 'mongoose';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        email: string;
        role: UserRole;
        moderatorClubs?: Types.ObjectId[];
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to check if user has required role(s)
 * @param roles - Array of allowed roles
 */
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if user is admin or moderator
 */
export const requireModeratorOrAdmin = requireRole(['admin', 'moderator']);

/**
 * Permission types
 */
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage';
export type PermissionResource =
  | 'event'
  | 'club'
  | 'user'
  | 'registration'
  | 'announcement';

/**
 * Check if user has specific permission
 * @param resource - The resource type
 * @param action - The action type
 */
export const requirePermission = (
  resource: PermissionResource,
  action: PermissionAction
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { role } = req.user;

    // Admins have all permissions
    if (role === 'admin') {
      return next();
    }

    // Define permission matrix
    const permissions: Record<
      UserRole,
      Record<PermissionResource, PermissionAction[]>
    > = {
      admin: {
        event: ['create', 'read', 'update', 'delete', 'manage'],
        club: ['create', 'read', 'update', 'delete', 'manage'],
        user: ['create', 'read', 'update', 'delete', 'manage'],
        registration: ['create', 'read', 'update', 'delete', 'manage'],
        announcement: ['create', 'read', 'update', 'delete', 'manage'],
      },
      moderator: {
        event: ['create', 'read', 'update', 'delete'],
        club: ['read', 'update'],
        user: ['read'],
        registration: ['read', 'update'],
        announcement: ['create', 'read', 'update', 'delete'],
      },
      member: {
        event: ['read'],
        club: ['read'],
        user: ['read'],
        registration: ['read'],
        announcement: ['read'],
      },
      user: {
        event: ['read'],
        club: ['read'],
        user: ['read'],
        registration: ['create', 'read', 'delete'],
        announcement: ['read'],
      },
    };

    const allowedActions = permissions[role]?.[resource] || [];

    if (!allowedActions.includes(action)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${action} ${resource}`,
      });
    }

    next();
  };
};

/**
 * Check if user has access to a specific club
 * Admins have access to all clubs
 * Moderators have access to clubs they moderate
 */
export const requireClubAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const { role, moderatorClubs } = req.user;

  // Admins have access to all clubs
  if (role === 'admin') {
    return next();
  }

  // Get club ID from params or body
  const clubId = req.params.clubId || req.body.clubId;

  if (!clubId) {
    return res.status(400).json({
      success: false,
      message: 'Club ID is required',
    });
  }

  // Check if user is a moderator of this club
  if (role === 'moderator' && moderatorClubs) {
    const hasAccess = moderatorClubs.some(
      (modClubId) => modClubId.toString() === clubId.toString()
    );

    if (hasAccess) {
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    message: "You don't have access to this club",
  });
};

/**
 * Check if user owns a resource or is an admin
 */
export const requireOwnershipOrAdmin = (
  resourceIdParam: string = 'id',
  userIdField: string = 'createdBy'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { role, _id } = req.user;

    // Admins bypass ownership check
    if (role === 'admin') {
      return next();
    }

    // Get resource from request (will need to be fetched from DB in actual implementation)
    // This is a simplified version - in real implementation, fetch the resource
    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID is required',
      });
    }

    // Store resource ID for downstream use
    req.resourceId = resourceId;

    // The actual ownership check should be done in the route handler
    // by fetching the resource and comparing userIdField
    next();
  };
};

/**
 * Rate limiting check for admin actions
 */
export const rateLimitAdmin = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userId = req.user._id.toString();
    const now = Date.now();

    // Get or create user's request record
    let userRecord = requests.get(userId);

    if (!userRecord || now > userRecord.resetTime) {
      userRecord = {
        count: 0,
        resetTime: now + windowMs,
      };
      requests.set(userId, userRecord);
    }

    userRecord.count++;

    // Check if limit exceeded
    if (userRecord.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
      });
    }

    next();
  };
};

// Extend Request interface for resourceId
declare global {
  namespace Express {
    interface Request {
      resourceId?: string;
    }
  }
}

export default {
  requireRole,
  requireAdmin,
  requireModeratorOrAdmin,
  requirePermission,
  requireClubAccess,
  requireOwnershipOrAdmin,
  rateLimitAdmin,
};
