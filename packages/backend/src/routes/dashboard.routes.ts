import { Router } from 'express';
import {
  getUserDashboardStats,
  getUserUpcomingEvents,
  getUserClubs,
  getModeratorDashboardStats,
  getModeratorEvents,
  getModeratorPendingRegistrations,
  getAdminDashboardStats,
  getAdminRecentActivity,
  getSystemHealth,
} from '../controllers/dashboard.controller.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/permission.middleware.js';

const router: Router = Router();

// User dashboard routes
router.get('/user/stats', isAuthenticated, getUserDashboardStats);
router.get('/user/events', isAuthenticated, getUserUpcomingEvents);
router.get('/user/clubs', isAuthenticated, getUserClubs);

// Moderator dashboard routes
router.get(
  '/moderator/stats',
  isAuthenticated,
  requireRole(['moderator', 'admin']),
  getModeratorDashboardStats
);
router.get(
  '/moderator/events',
  isAuthenticated,
  requireRole(['moderator', 'admin']),
  getModeratorEvents
);
router.get(
  '/moderator/registrations',
  isAuthenticated,
  requireRole(['moderator', 'admin']),
  getModeratorPendingRegistrations
);

// Admin dashboard routes
router.get(
  '/admin/stats',
  isAuthenticated,
  requireRole(['admin']),
  getAdminDashboardStats
);
router.get(
  '/admin/activity',
  isAuthenticated,
  requireRole(['admin']),
  getAdminRecentActivity
);
router.get(
  '/admin/health',
  isAuthenticated,
  requireRole(['admin']),
  getSystemHealth
);

export default router;
