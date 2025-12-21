import express, { Router } from 'express';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import {
  requireModeratorOrAdmin,
  requireClubAccess,
} from '../middlewares/permission.middleware.js';
import {
  getModeratedClubs,
  getClubAnalytics,
  getClubMembers,
  addClubMember,
  removeClubMember,
  updateMemberRole,
  createEvent,
  updateEvent,
  deleteEvent,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  createClubAnnouncement,
  exportClubData,
  getClubEvents,
} from '../controllers/moderator.controller.js';

const router: Router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Get all clubs moderated by the current user
router.get('/clubs', requireModeratorOrAdmin, getModeratedClubs);

// Club-specific routes (require club access)
router.get(
  '/clubs/:clubId/analytics',
  requireModeratorOrAdmin,
  requireClubAccess,
  getClubAnalytics
);

router.get(
  '/clubs/:clubId/members',
  requireModeratorOrAdmin,
  requireClubAccess,
  getClubMembers
);

router.post(
  '/clubs/:clubId/members',
  requireModeratorOrAdmin,
  requireClubAccess,
  addClubMember
);

router.delete(
  '/clubs/:clubId/members/:memberId',
  requireModeratorOrAdmin,
  requireClubAccess,
  removeClubMember
);

router.put(
  '/clubs/:clubId/members/:memberId/role',
  requireModeratorOrAdmin,
  requireClubAccess,
  updateMemberRole
);

router.get(
  '/clubs/:clubId/events',
  requireModeratorOrAdmin,
  requireClubAccess,
  getClubEvents
);

router.get(
  '/clubs/:clubId/export',
  requireModeratorOrAdmin,
  requireClubAccess,
  exportClubData
);

// Event management
router.post('/events', requireModeratorOrAdmin, createEvent);

router.put('/events/:eventId', requireModeratorOrAdmin, updateEvent);

router.delete('/events/:eventId', requireModeratorOrAdmin, deleteEvent);

// Registration management
router.get('/registrations', requireModeratorOrAdmin, getPendingRegistrations);

router.put(
  '/registrations/:registrationId/approve',
  requireModeratorOrAdmin,
  approveRegistration
);

router.put(
  '/registrations/:registrationId/reject',
  requireModeratorOrAdmin,
  rejectRegistration
);

// Announcements
router.post(
  '/clubs/:clubId/announcements',
  requireModeratorOrAdmin,
  requireClubAccess,
  createClubAnnouncement
);

export default router;
