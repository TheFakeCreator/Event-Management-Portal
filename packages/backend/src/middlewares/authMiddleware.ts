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
  console.log('[Auth Middleware] Request received:', {
    path: req.path,
    method: req.method,
    hasCookie: !!(req.cookies && req.cookies.token),
    hasAuthHeader: !!req.headers.authorization,
  });

  try {
    const token =
      (req.cookies && req.cookies.token) ||
      req.headers.authorization?.replace('Bearer ', '');

    console.log('[Auth Middleware] Token check:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    });

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No token provided',
      });
      return;
    }

    // Verify token with enhanced validation
    console.log('[Auth Middleware] Verifying token...');
    const decoded = verifyToken(token, 'access');
    console.log('[Auth Middleware] Token verified:', {
      userId: decoded.userId,
    });

    const user = await User.findById(decoded.userId).select('-password');
    console.log('[Auth Middleware] User found:', {
      userId: user?._id,
      email: user?.email,
    });

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
    req.user = user as any; // Also set req.user for permission middleware
    req.isUserAuthenticated = true;

    next();
  } catch (error) {
    console.error('Authentication Error:', error);

    // Clear invalid token
    res.clearCookie('token', getClearCookieOptions());

    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication token',
          error: 'Token verification failed',
        });
        return;
      } else if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Authentication token expired',
          error: 'Please login again',
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'Internal server error',
    });
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
      (req.cookies && req.cookies.token) ||
      req.headers.authorization?.replace('Bearer ', '');

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
    const token = req.cookies && req.cookies.token;
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
