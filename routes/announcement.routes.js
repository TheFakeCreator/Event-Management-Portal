import express from "express";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
} from "../controllers/announcement.controller.js";
import {
  validateAnnouncement,
  validateParams,
  validateQuery,
  securityMiddleware,
} from "../middlewares/inputValidationMiddleware.js";

const router = express.Router();

// Get all announcements (accessible to all users)
router.get(
  "/",
  securityMiddleware,
  isAuthenticatedLineant,
  validateQuery(["page", "limit", "search"]),
  getAllAnnouncements
);

// Create new announcement (admin only)
router.post(
  "/create",
  securityMiddleware,
  isAuthenticated,
  isAdmin,
  validateAnnouncement.create,
  createAnnouncement
);

// Get announcement by ID for editing (admin only)
router.get(
  "/:id/edit",
  securityMiddleware,
  isAuthenticated,
  isAdmin,
  validateParams(["id"]),
  getAnnouncementById
);

// Update announcement (admin only)
router.put(
  "/:id",
  securityMiddleware,
  isAuthenticated,
  isAdmin,
  validateParams(["id"]),
  validateAnnouncement.update,
  updateAnnouncement
);

// Delete announcement (admin only)
router.delete(
  "/:id",
  securityMiddleware,
  isAuthenticated,
  isAdmin,
  validateParams(["id"]),
  deleteAnnouncement
);

export default router;
