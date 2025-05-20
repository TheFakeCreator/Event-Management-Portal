import express from "express";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import { createClub } from "../controllers/club.controller.js";
import Club from "../models/club.model.js";
import { isClubModerator } from "../middlewares/moderatorMiddleware.js";

const router = express.Router();

// Fetch all clubs
router.get("/", isAuthenticatedLineant, async (req, res) => {
  try {
    const user = req.user;
    const clubs = await Club.find();
    res.render("clubs", {
      title: "Clubs List",
      clubs,
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching clubs");
  }
});
// Create a new club (Admin only)
// Admin check should be placed here.
router.get("/add", isAuthenticated, isAdmin, (req, res) => {
  const user = req.user;
  res.render("add-club", {
    title: "Add Club",
    isAuthenticated: req.isAuthenticated,
    user,
  });
});
router.post("/add", isAuthenticated, isAdmin, createClub);
// Club details routes
// Allowed subpages and their corresponding view files
const clubSubPages = {
  about: "clubDetailsAbout",
  recruitments: "clubDetailsRecruitments",
  gallery: "clubDetailsGallery",
  socials: "clubDetailsSocials",
  events: "clubDetailsEvents",
  members: "clubDetailsMembers",
};

// Generic route handler for club sub-pages
router.get("/:id/:subPage", isAuthenticatedLineant, async (req, res) => {
  try {
    const user = req.user;
    const { id, subPage } = req.params;

    const view = clubSubPages[subPage];
    if (!view) {
      return res
        .status(404)
        .render("404", {
          message: "Club not found",
          title: "404 Page",
          user,
          isAuthenticated: req.isAuthenticated,
        });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res
        .status(404)
        .render("404", {
          message: "Club not found",
          title: "404 Page",
          user,
          isAuthenticated: req.isAuthenticated,
        });
    }

    res.render(view, {
      title: club.name,
      club,
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching club details");
  }
});

// Test route for moderator middleware
router.get("/:id/mod-section", isAuthenticated, isClubModerator, (req, res) => {
  res.send(
    "You are a moderator (or admin) for this club and can access this section."
  );
});

export default router;
