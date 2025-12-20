import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { isModeratorOrAdmin } from '../middlewares/moderatorMiddleware.js';
import {
  getRecruitments,
  getNewRecruitments,
  postNewRecruitment,
  postApplyRecruitment,
  getRecruitmentDetails,
} from '../controllers/recruitment.controller.js';

const router: Router = express.Router();

// API Routes (JSON responses)
// GET Routes
router.get('/', (req, res, next) => getRecruitments(req as any, res, next));
//TODO: this route needs to be updated it is not being used currently
router.get('/new', (req, res, next) =>
  getNewRecruitments(req as any, res, next)
);
router.get('/:id', (req, res, next) =>
  getRecruitmentDetails(req as any, res, next)
);

// POST Routes
router.post('/', isAuthenticated, isModeratorOrAdmin, (req, res, next) =>
  postNewRecruitment(req as any, res, next)
);
router.post('/:id/apply', isAuthenticated, (req, res, next) =>
  postApplyRecruitment(req as any, res, next)
);

export default router;
