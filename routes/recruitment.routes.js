import express from "express";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";
import { isClubModerator } from "../middlewares/moderatorMiddleware.js";
import {
  getNewRecruitments,
  getRecruitments,
  getRecruitmentDetails,
  postApplyRecruitment,
  postNewRecruitment,
} from "../controllers/recruitment.controller.js";

const router = express.Router();

//GET Routes
router.get("/", isAuthenticatedLineant, getRecruitments);
router.get("/new", isAuthenticatedLineant, isClubModerator, getNewRecruitments);
router.get("/:id", isAuthenticatedLineant, getRecruitmentDetails);

// POST Routes
router.post(
  "/new",
  isAuthenticatedLineant,
  isClubModerator,
  postNewRecruitment
);
router.post("/:id", isAuthenticatedLineant, async (req, res, next) => {
  try {
    await postApplyRecruitment(req, res, next);
  } catch (err) {
    req.flash("error", "Failed to submit application.");
    res.redirect(`/recruitment/${req.params.id}`);
  }
});

export default router;
