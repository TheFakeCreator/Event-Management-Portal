import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import {
  getIndex,
  getAbout,
  getPrivacy,
} from '../controllers/index.controller.js';

const router: Router = express.Router();

// API Routes (JSON responses)
router.get('/', (req, res, next) => getIndex(req as any, res, next));
router.get('/about', (req, res, next) => getAbout(req as any, res, next));
router.get('/privacy', (req, res, next) => getPrivacy(req as any, res, next));

export default router;
