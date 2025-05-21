import express from "express";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";
import { isClubModerator } from "../middlewares/moderatorMiddleware.js";
import {
  getApplyRecruitment,
  getNewRecruitments,
  getRecruitments,
  postApplyRecruitment,
  postNewRecruitment,
} from "../controllers/recruitment.controller.js";

const router = express.Router();

// GET /recruitments - List all recruitments
router.get("/", isAuthenticatedLineant, getRecruitments);

// GET /recruitment/new - Show form to create a new recruitment
router.get("/new", isAuthenticatedLineant, isClubModerator, getNewRecruitments);

// GET /recruitment/apply/:id - Show application form for a recruitment
router.get("/apply/:id", isAuthenticatedLineant, getApplyRecruitment);

// POST /recruitment/new - Handle form submission to create a new recruitment
router.post(
  "/new",
  isAuthenticatedLineant,
  isClubModerator,
  postNewRecruitment
);

// POST /recruitment/apply/:id - Handle application form submission
router.post("/apply/:id", isAuthenticatedLineant, postApplyRecruitment);

// Add more recruitment routes here as needed

export default router;
