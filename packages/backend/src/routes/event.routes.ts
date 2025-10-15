import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { isModeratorOrAdmin } from '../middlewares/moderatorMiddleware.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  editEvent,
  deleteEvent,
  registerEvent,
  getEventParticipants,
  reportEvent,
  addEventWinners,
} from '../controllers/event.controller.js';

const router: Router = express.Router();

// API Routes (JSON responses)
// GET Routes
router.get('/', (req, res, next) => getAllEvents(req as any, res, next));
router.get('/:id', isAuthenticated, (req, res, next) =>
  getEventById(req as any, res, next)
);
router.get('/:id/participants', isAuthenticated, (req, res, next) =>
  getEventParticipants(req as any, res, next)
);

// POST Routes
router.post('/', isAuthenticated, isModeratorOrAdmin, (req, res, next) =>
  createEvent(req as any, res, next)
);
router.post('/:id/register', isAuthenticated, (req, res, next) =>
  registerEvent(req as any, res, next)
);
router.post('/:id/report', isAuthenticated, (req, res, next) =>
  reportEvent(req as any, res, next)
);
router.post(
  '/:id/winners',
  isAuthenticated,
  isModeratorOrAdmin,
  (req, res, next) => addEventWinners(req as any, res, next)
);

// PUT Routes
router.put('/:id', isAuthenticated, isModeratorOrAdmin, (req, res, next) =>
  editEvent(req as any, res, next)
);

// DELETE Routes
router.delete('/:id', isAuthenticated, isModeratorOrAdmin, (req, res, next) =>
  deleteEvent(req as any, res, next)
);

export default router;
