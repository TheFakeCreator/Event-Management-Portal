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
  getEditClub,
  postEditClub
} from "../controllers/club.controller.js";
import { isClubModerator } from "../middlewares/moderatorMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// GET Routes
router.get("/", isAuthenticatedLineant, getClubs);
router.get("/add", isAuthenticated, isAdmin, getAddClub);
router.get("/:id/edit", isAuthenticated, isClubModerator, getEditClub);
router.get("/:id/:subPage", isAuthenticatedLineant, getClubTab);

// POST Routes
router.post("/add", isAuthenticated, isAdmin, createClub);
router.post("/:id/edit", isAuthenticated, isClubModerator, postEditClub);

// POST: Upload image to club gallery
router.post(
  "/:id/gallery/upload",
  isAuthenticated,
  isClubModerator,
  upload.single("galleryImage"),
  async (req, res, next) => {
    try {
      const clubId = req.params.id;
      const Club = (await import("../models/club.model.js")).default;
      const club = await Club.findById(clubId);
      if (!club) {
        req.flash("error_msg", "Club not found.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      if (!req.file) {
        req.flash("error_msg", "No image uploaded.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      // Add to gallery
      club.gallery.unshift({
        url: req.file.path,
        caption: req.body.caption,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      });
      await club.save();
      req.flash("success_msg", "Image uploaded to gallery!");
      res.redirect("/club/" + clubId + "/gallery");
    } catch (err) {
      next(err);
    }
  }
);

// POST: Change club display image
router.post(
  "/:id/image/upload",
  isAuthenticated,
  isClubModerator,
  upload.single("clubImage"),
  async (req, res, next) => {
    try {
      const clubId = req.params.id;
      const Club = (await import("../models/club.model.js")).default;
      const club = await Club.findById(clubId);
      if (!club) {
        req.flash("error_msg", "Club not found.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      if (!req.file) {
        req.flash("error_msg", "No image uploaded.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      // Update club image
      club.image = req.file.path;
      await club.save();
      req.flash("success_msg", "Club display image updated!");
      res.redirect("/club/" + clubId + "/gallery");
    } catch (err) {
      next(err);
    }
  }
);

// Test route for moderator middleware
router.get("/:id/mod-section", isAuthenticated, isClubModerator, (req, res) => {
  res.send(
    "You are a moderator (or admin) for this club and can access this section."
  );
});

// Route: View all recruitment responses for a club (admin/moderator only)
router.get('/:id/recruitments/responses', isAuthenticatedLineant, async (req, res) => {
  const user = req.user;
  const clubId = req.params.id;
  const Club = (await import('../models/club.model.js')).default;
  const Recruitment = (await import('../models/recruitment.model.js')).default;
  const Registration = (await import('../models/registration.model.js')).default;

  // Check permissions
  const club = await Club.findById(clubId);
  if (!club) return res.status(404).render('404', { title: '404', user, isAuthenticated: req.isAuthenticated });
  const isMod = user && (user.role === 'admin' || (club.moderators && club.moderators.map(m=>m.toString()).includes(user._id.toString())));
  if (!isMod) return res.status(403).render('unauthorized', { title: 'Unauthorized', user, isAuthenticated: req.isAuthenticated });

  // Get all recruitments for this club
  const recruitments = await Recruitment.find({ club: clubId });
  const recruitmentIds = recruitments.map(r => r._id);
  // Get all registrations for these recruitments
  const responses = await Registration.find({ recruitment: { $in: recruitmentIds } }).lean();
  // Optionally, populate recruitment info and normalize answers
  const responsesWithRecruitment = await Promise.all(responses.map(async (resp) => {
    const rec = recruitments.find(r => r._id.toString() === resp.recruitment.toString());
    // Normalize answers: support both 'answers' and 'customFields' keys
    let answers = resp.answers || resp.customFields || null;
    return { ...resp, recruitmentTitle: rec ? rec.title : 'Recruitment', recruitmentId: rec ? rec._id : null, answers };
  }));

  res.render('recruitmentResponses', {
    title: 'Recruitment Responses',
    user,
    isAuthenticated: req.isAuthenticated,
    club,
    responses: responsesWithRecruitment
  });
});

export default router;
