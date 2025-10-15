import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { isModeratorOrAdmin } from '../middlewares/moderatorMiddleware.js';
import {
  getAllAnnouncements,
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller.js';

const router: Router = express.Router();

// API Routes (JSON responses)
// GET Routes
router.get('/', (req, res, next) => getAllAnnouncements(req as any, res, next));
router.get('/:id', (req, res, next) =>
  getAnnouncementById(req as any, res, next)
);

// POST Routes
router.post('/', isAuthenticated, isModeratorOrAdmin, (req, res, next) =>
  createAnnouncement(req as any, res, next)
);

// PUT Routes
router.put('/:id', isAuthenticated, isModeratorOrAdmin, (req, res, next) =>
  updateAnnouncement(req as any, res, next)
);

// DELETE Routes
router.delete('/:id', isAuthenticated, isModeratorOrAdmin, (req, res, next) =>
  deleteAnnouncement(req as any, res, next)
);

export default router;
