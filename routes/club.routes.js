import express from "express";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  createClub,
  getAddClub,
  getClubs,
  getClubTab,
} from "../controllers/club.controller.js";
import Club from "../models/club.model.js";
import { isClubModerator } from "../middlewares/moderatorMiddleware.js";

const router = express.Router();

// Fetch all clubs
router.get("/", isAuthenticatedLineant, getClubs);

// Create a new club (Admin only)
// Admin check should be placed here.
router.get("/add", isAuthenticated, isAdmin, getAddClub);
router.post("/add", isAuthenticated, isAdmin, createClub);

// Club details routes
// Allowed subpages and their corresponding view files
// Generic route handler for club sub-pages
router.get("/:id/:subPage", isAuthenticatedLineant, getClubTab);

// Test route for moderator middleware
router.get("/:id/mod-section", isAuthenticated, isClubModerator, (req, res) => {
  res.send(
    "You are a moderator (or admin) for this club and can access this section."
  );
});

export default router;
