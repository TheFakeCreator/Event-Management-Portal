import { Request, Response, NextFunction } from 'express';
import {
  AuthenticatedRequest,
  ClubModeratorRequest,
} from '../types/express.js';
import Club from '../models/club.model.js';

/**
 * Middleware to allow access only to moderators of a specific club (or admins).
 * Usage: Pass the club id as req.params.id or req.query.club or req.body.club or req.body.clubId
 */
export const isClubModerator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as ClubModeratorRequest;
    const user = authReq.userInfo;

    // Not logged in
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'You must be logged in',
      });
      return;
    }

    // Admins always have access
    if (user.role === 'admin') {
      authReq.isClubMod = true;
      return next();
    }

    // Get club ID from multiple sources (params, query, body)
    const clubId =
      req.params.id ||
      req.params.clubId ||
      (req.query.club as string) ||
      req.body.clubId ||
      (req.body.club && req.body.club._id);

    if (!clubId) {
      res.status(400).json({
        success: false,
        message: 'Club ID is required',
        error: 'Missing club identifier',
      });
      return;
    }

    // Check if user has moderatorClubs (stored in User document)
    if (
      user.moderatorClubs &&
      user.moderatorClubs.some((id: any) => id.toString() === clubId.toString())
    ) {
      authReq.isClubMod = true;
      return next();
    }

    // Double-check from the Club document
    const club = await Club.findById(clubId);
    if (
      club &&
      club.moderators &&
      club.moderators.some(
        (modId: any) => modId.toString() === user._id.toString()
      )
    ) {
      authReq.isClubMod = true;
      return next();
    }

    // Access denied
    res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'Club moderator privileges required',
    });
  } catch (error) {
    console.error('Moderator middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'Internal server error',
    });
  }
};

// Simple middleware to allow only admins and moderators
export const isModeratorOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;

  if (
    !authReq.userInfo ||
    !['admin', 'moderator'].includes(authReq.userInfo.role)
  ) {
    res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'Admin or moderator privileges required',
    });
    return;
  }

  next();
};

// Legacy SSR middleware (if needed)
export const isClubModeratorSSR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as ClubModeratorRequest;
    const user = authReq.userInfo;

    if (!user) {
      res.status(401).render('unauthorized', {
        title: 'Unauthorized',
        message: 'You must be logged in.',
        user: null,
        isAuthenticated: false,
      });
      return;
    }

    if (user.role === 'admin') {
      authReq.isClubMod = true;
      return next();
    }

    const clubId =
      req.params.id ||
      (req.query.club as string) ||
      req.body.clubId ||
      (req.body.club && req.body.club._id);

    if (!clubId) {
      res.status(400).render('unauthorized', {
        title: 'Unauthorized',
        message: 'Club ID is required.',
        user,
        isAuthenticated: authReq.isAuthenticated,
      });
      return;
    }

    if (
      user.moderatorClubs &&
      user.moderatorClubs.some((id: any) => id.toString() === clubId.toString())
    ) {
      authReq.isClubMod = true;
      return next();
    }

    const club = await Club.findById(clubId);
    if (
      club &&
      club.moderators &&
      club.moderators.some(
        (modId: any) => modId.toString() === user._id.toString()
      )
    ) {
      authReq.isClubMod = true;
      return next();
    }

    res.status(403).render('unauthorized', {
      title: 'Unauthorized',
      message: 'Access denied. Moderator-only section.',
      user,
      isAuthenticated: authReq.isAuthenticated,
    });
  } catch (error) {
    console.error('Moderator middleware error:', error);
    const authReq = req as ClubModeratorRequest;
    res.status(500).render('unauthorized', {
      title: 'Server Error',
      message: 'Something went wrong. Please try again.',
      user: authReq.userInfo,
      isAuthenticated: authReq.isAuthenticated,
    });
  }
};
