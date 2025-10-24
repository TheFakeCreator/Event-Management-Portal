import { Request, Response, NextFunction } from 'express';
import {
  DEV_BYPASS_CONFIG,
  DEV_USERS,
  convertDevUserToUserType,
  type DevUser,
} from '../configs/devBypass.js';

// Development bypass middleware - ONLY works in development
export const devBypass = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only enable in development with explicit flag
  if (!DEV_BYPASS_CONFIG.enabled) {
    return next();
  }

  try {
    // Check for bypass header
    const bypassHeader = req.headers[DEV_BYPASS_CONFIG.bypassHeader] as string;
    const userSwitchHeader = req.headers[
      DEV_BYPASS_CONFIG.userSwitchHeader
    ] as string;

    // If bypass is not requested, continue with normal auth flow
    if (!bypassHeader || bypassHeader !== 'true') {
      return next();
    }

    // Log bypass usage if enabled
    if (DEV_BYPASS_CONFIG.logBypassUsage) {
      console.log(`🔓 Dev Bypass: ${req.method} ${req.path} - IP: ${req.ip}`);
    }

    // Determine which user to use
    let targetUser: keyof typeof DEV_USERS = DEV_BYPASS_CONFIG.defaultUser;

    if (
      DEV_BYPASS_CONFIG.allowUserSwitch &&
      userSwitchHeader &&
      DEV_USERS[userSwitchHeader as keyof typeof DEV_USERS]
    ) {
      targetUser = userSwitchHeader as keyof typeof DEV_USERS;
    }

    // Get the dev user and convert to UserType
    const devUser = DEV_USERS[targetUser];
    const user = convertDevUserToUserType(devUser);

    // Set user info on request
    req.userInfo = user;
    req.isUserAuthenticated = true;

    // Add bypass info for debugging
    req.devBypassInfo = {
      enabled: true,
      userType: targetUser,
      timestamp: new Date().toISOString(),
    };

    if (DEV_BYPASS_CONFIG.logBypassUsage) {
      console.log(`👤 Dev User: ${user.name} (${user.role}) - ${user.email}`);
    }

    next();
  } catch (error) {
    console.error('Dev Bypass Error:', error);
    // If bypass fails, continue with normal auth flow
    next();
  }
};

// Enhanced authentication middleware with dev bypass
export const isAuthenticatedWithBypass = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First try dev bypass
  devBypass(req, res, async () => {
    // If dev bypass was successful, skip normal auth
    if (req.isUserAuthenticated && req.devBypassInfo) {
      return next();
    }

    // Fall back to normal authentication
    const { isAuthenticated } = await import('./authMiddleware.js');
    return isAuthenticated(req, res, next);
  });
};

// Optional authentication with dev bypass
export const optionalAuthWithBypass = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First try dev bypass
  devBypass(req, res, async () => {
    // If dev bypass was successful, skip normal auth
    if (req.isUserAuthenticated && req.devBypassInfo) {
      return next();
    }

    // Fall back to normal optional auth
    const { optionalAuth } = await import('./authMiddleware.js');
    return optionalAuth(req, res, next);
  });
};

// Development user info endpoint
export const getDevUserInfo = (req: Request, res: Response): void => {
  if (!DEV_BYPASS_CONFIG.enabled) {
    res.status(404).json({
      success: false,
      message: 'Not found',
    });
    return;
  }

  const availableUsers = Object.keys(DEV_USERS).map((key) => {
    const user = DEV_USERS[key as keyof typeof DEV_USERS];
    return {
      key,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };
  });

  res.json({
    success: true,
    message: 'Development bypass configuration',
    data: {
      enabled: DEV_BYPASS_CONFIG.enabled,
      config: {
        defaultUser: DEV_BYPASS_CONFIG.defaultUser,
        allowUserSwitch: DEV_BYPASS_CONFIG.allowUserSwitch,
        bypassHeader: DEV_BYPASS_CONFIG.bypassHeader,
        userSwitchHeader: DEV_BYPASS_CONFIG.userSwitchHeader,
      },
      availableUsers,
      usage: {
        headers: {
          [DEV_BYPASS_CONFIG.bypassHeader]: 'true',
          [DEV_BYPASS_CONFIG.userSwitchHeader]:
            'admin|moderator|user|unverified|inactive',
        },
        example: `curl -H "${DEV_BYPASS_CONFIG.bypassHeader}: true" -H "${DEV_BYPASS_CONFIG.userSwitchHeader}: admin" http://localhost:3001/api/protected-route`,
      },
    },
  });
};

export default {
  devBypass,
  isAuthenticatedWithBypass,
  optionalAuthWithBypass,
  getDevUserInfo,
};
