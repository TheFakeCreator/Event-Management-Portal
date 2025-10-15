import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';

// Admin role middleware for JSON APIs
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.userInfo || authReq.userInfo.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'Admin privileges required',
    });
    return;
  }

  next();
};

// Admin or Moderator role middleware
export const isAdminOrModerator = (
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
export const isAdminSSR = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.userInfo || authReq.userInfo.role !== 'admin') {
    res.status(403).render('unauthorized', {
      title: 'Unauthorized',
      isAuthenticated: authReq.isUserAuthenticated,
      user: authReq.userInfo,
    });
    return;
  }

  next();
};
