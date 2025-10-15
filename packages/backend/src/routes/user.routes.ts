import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/upload.js';
import {
  getUserProfile,
  updateProfile,
  requestRole,
  changePassword,
} from '../controllers/user.controller.js';

const router: Router = express.Router();

// API Routes (JSON responses)
// GET Routes
router.get('/:userId/profile', isAuthenticated, (req, res, next) =>
  getUserProfile(req as any, res, next)
);

// POST/PUT Routes
router.post(
  '/:userId/profile',
  isAuthenticated,
  upload.single('avatar'),
  (req, res, next) => updateProfile(req as any, res, next)
);
router.post('/:userId/request-role', isAuthenticated, (req, res, next) =>
  requestRole(req as any, res, next)
);
router.post('/:userId/change-password', isAuthenticated, (req, res, next) =>
  changePassword(req as any, res, next)
);

export default router;
