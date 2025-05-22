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
import { isClubModerator } from "../middlewares/moderatorMiddleware.js";

const router = express.Router();

// GET Routes
router.get("/", isAuthenticatedLineant, getClubs);
router.get("/add", isAuthenticated, isAdmin, getAddClub);
router.get("/:id/:subPage", isAuthenticatedLineant, getClubTab);

// POST Routes
router.post("/add", isAuthenticated, isAdmin, createClub);

// Test route for moderator middleware
router.get("/:id/mod-section", isAuthenticated, isClubModerator, (req, res) => {
  res.send(
    "You are a moderator (or admin) for this club and can access this section."
  );
});

export default router;
