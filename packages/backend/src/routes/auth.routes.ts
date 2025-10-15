import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyUser,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import {
  authRateLimit,
  passwordResetRateLimit,
} from '../middlewares/rateLimitMiddleware.js';

const router: Router = express.Router();

// Rate limiting middleware for auth endpoints
router.use('/login', authRateLimit);
router.use('/signup', authRateLimit);
router.use('/forgot-password', passwordResetRateLimit);
router.use('/reset-password', passwordResetRateLimit);

// API Routes (JSON responses)
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/logout', isAuthenticated, (req, res, next) =>
  logoutUser(req as any, res, next)
);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Email verification route
router.get('/verify/:token', verifyUser);

// API endpoint to check authentication status
router.get('/status', (req: Request, res: Response) => {
  const user = req.user;

  if (user && req.isUserAuthenticated) {
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: (user as any)._id,
        name: (user as any).name,
        email: (user as any).email,
        username: (user as any).username,
        role: (user as any).role,
        isVerified: (user as any).isVerified,
      },
    });
  } else {
    res.json({
      success: true,
      authenticated: false,
      user: null,
    });
  }
});

export default router;
