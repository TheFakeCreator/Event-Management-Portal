import express from "express";
import { isAuthenticated, isAuthenticatedLineant } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";

const router = express.Router();

// Get all announcements (accessible to all users)
router.get("/", isAuthenticatedLineant, getAllAnnouncements);

// Create new announcement (admin only)
router.post("/create", isAuthenticated, isAdmin, createAnnouncement);

// Delete announcement (admin only)
router.delete("/:id", isAuthenticated, isAdmin, deleteAnnouncement);

export default router;
