import * as express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import {
  getManageRoles,
  getRoleRequests,
  getManageClubs,
  getEditClub,
  getManageUsers,
  getManageEvents,
  getEditEvent,
  getLogs,
  assignRole,
  approveRoleRequest,
  rejectRoleRequest,
  createClub,
  editClub,
  deleteClub,
  deleteUser,
  deleteEvent,
  editEvent,
  addModeratorToClub,
  removeModeratorFromClub,
} from '../controllers/admin.controller.js';

const router: Router = express.Router();

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);

// API Routes (JSON responses)
// GET Routes
router.get('/roles', (req, res, next) => getManageRoles(req as any, res, next));
router.get('/role-requests', (req, res, next) =>
  getRoleRequests(req as any, res, next)
);
router.get('/clubs', (req, res, next) => getManageClubs(req as any, res, next));
router.get('/clubs/:id', (req, res, next) =>
  getEditClub(req as any, res, next)
);
router.get('/users', (req, res, next) => getManageUsers(req as any, res, next));
router.get('/events', (req, res, next) =>
  getManageEvents(req as any, res, next)
);
router.get('/events/:id', (req, res, next) =>
  getEditEvent(req as any, res, next)
);
router.get('/logs', (req, res, next) => getLogs(req as any, res, next));

// POST Routes
router.post('/assign-role', (req, res, next) =>
  assignRole(req as any, res, next)
);
router.post('/role-requests/:userId/approve', (req, res) =>
  approveRoleRequest(req as any, res)
);
router.post('/role-requests/:userId/reject', (req, res) =>
  rejectRoleRequest(req as any, res)
);
router.post('/clubs', (req, res) => createClub(req as any, res));
router.post('/clubs/:id/moderators', (req, res) =>
  addModeratorToClub(req as any, res)
);

// PUT Routes
router.put('/clubs/:id', (req, res) => editClub(req as any, res));
router.put('/events/:id', (req, res) => editEvent(req as any, res));

// DELETE Routes
router.delete('/clubs/:id', (req, res) => deleteClub(req as any, res));
router.delete('/clubs/:id/moderators/:userId', (req, res) =>
  removeModeratorFromClub(req as any, res)
);
router.delete('/users/:id', (req, res) => deleteUser(req as any, res));
router.delete('/events/:id', (req, res) => deleteEvent(req as any, res));

export default router;
