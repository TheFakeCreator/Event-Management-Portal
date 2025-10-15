import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User as UserType } from '@event-management/shared';
import User from '../models/user.model.js';
import { verifyToken, getClearCookieOptions } from '../utils/jwtManager.js';
import { AuthenticatedRequest } from '../types/express.js';

// Middleware for JSON API authentication (no redirects)
export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No token provided',
      });
      return;
    }

    // Verify token with enhanced validation
    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.clearCookie('token', getClearCookieOptions());
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        error: 'User not found',
      });
      return;
    }

    // Verify user is still active/verified
    if (!user.isVerified) {
      res.status(401).json({
        success: false,
        message: 'Account not verified',
        error: 'Please verify your email address',
      });
      return;
    }

    // Add user to request object
    req.userInfo = user as unknown as UserType;
    req.isUserAuthenticated = true;

    next();
  } catch (error) {
    console.error('Authentication Error:', error);

    // Clear invalid token
    res.clearCookie('token', getClearCookieOptions());

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        error: 'Token verification failed',
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Authentication token expired',
        error: 'Please login again',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: 'Internal server error',
      });
    }
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.isUserAuthenticated = false;
      return next();
    }

    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isVerified) {
      req.userInfo = user as unknown as UserType;
      req.isUserAuthenticated = true;
    } else {
      req.isUserAuthenticated = false;
      res.clearCookie('token', getClearCookieOptions());
    }

    next();
  } catch (error) {
    console.error('Optional Auth Error:', error);
    req.isUserAuthenticated = false;
    res.clearCookie('token', getClearCookieOptions());
    next();
  }
};

// Legacy middleware for SSR routes (if any remain)
export const isAuthenticatedSSR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;
    if (!token) {
      const redirectUrl = req.originalUrl;
      res.redirect(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isVerified) {
      const redirectUrl = req.originalUrl;
      res.redirect(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    req.userInfo = user as unknown as UserType;
    req.isUserAuthenticated = true;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    res.clearCookie('token', getClearCookieOptions());
    const redirectUrl = req.originalUrl;
    res.redirect(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
  }
};
