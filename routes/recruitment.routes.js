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
import {
  validateRecruitment,
  validateParams,
  validateQuery,
  securityMiddleware,
} from "../middlewares/inputValidationMiddleware.js";
import { validateCSRF } from "../middlewares/csrfMiddleware.js";

const router = express.Router();

//GET Routes
router.get(
  "/",
  securityMiddleware,
  isAuthenticatedLineant,
  validateQuery(["search", "club", "status", "page", "limit"]),
  getRecruitments
);
router.get(
  "/new",
  securityMiddleware,
  isAuthenticatedLineant,
  isClubModerator,
  getNewRecruitments
);
router.get(
  "/:id",
  securityMiddleware,
  isAuthenticatedLineant,
  validateParams(["id"]),
  getRecruitmentDetails
);

// POST Routes
router.post(
  "/new",
  securityMiddleware,
  isAuthenticatedLineant,
  isClubModerator,
  validateCSRF,
  validateRecruitment.create,
  postNewRecruitment
);
router.post(
  "/:id",
  securityMiddleware,
  isAuthenticatedLineant,
  validateParams(["id"]),
  validateCSRF,
  validateRecruitment.apply,
  async (req, res, next) => {
    try {
      await postApplyRecruitment(req, res, next);
    } catch (err) {
      req.flash("error", "Failed to submit application.");
      res.redirect(`/recruitment/${req.params.id}`);
    }
  }
);

export default router;
