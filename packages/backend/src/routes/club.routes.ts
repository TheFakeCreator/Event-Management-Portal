import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { isClubModerator } from '../middlewares/moderatorMiddleware.js';
// import { upload } from '../middlewares/upload.js';
import {
  getAllClubs,
  getClubById,
  createClub,
  updateClub,
  editAboutClub,
  addClubSponsor,
  editClubSponsor,
  deleteClubSponsor,
} from '../controllers/club.controller.js';

const router: Router = express.Router();

// API Routes (JSON responses)
// GET Routes
router.get('/', (req, res, next) => getAllClubs(req as any, res, next));
router.get('/:id', (req, res, next) => getClubById(req as any, res, next));
router.get('/:id/:section', (req, res, next) =>
  getClubById(req as any, res, next)
);

// POST Routes
router.post('/', isAuthenticated, isAdmin, (req, res, next) =>
  createClub(req as any, res, next)
);
router.post(
  '/:id/sponsors',
  isAuthenticated,
  isClubModerator,
  (req, res, next) => addClubSponsor(req as any, res, next)
);

// PUT Routes
router.put('/:id', isAuthenticated, isClubModerator, (req, res, next) =>
  updateClub(req as any, res, next)
);
router.put('/:id/about', isAuthenticated, isClubModerator, (req, res, next) =>
  editAboutClub(req as any, res, next)
);
router.put(
  '/:id/sponsors/:sponsorId',
  isAuthenticated,
  isClubModerator,
  (req, res, next) => editClubSponsor(req as any, res, next)
);

// DELETE Routes
router.delete(
  '/:id/sponsors/:sponsorId',
  isAuthenticated,
  isClubModerator,
  (req, res, next) => deleteClubSponsor(req as any, res, next)
);

export default router;
