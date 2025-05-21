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

//GET Routes
router.get("/", isAuthenticatedLineant, getRecruitments);
router.get("/new", isAuthenticatedLineant, isClubModerator, getNewRecruitments);
router.get("/apply/:id", isAuthenticatedLineant, getApplyRecruitment);

// POST Routes
router.post(
  "/new",
  isAuthenticatedLineant,
  isClubModerator,
  postNewRecruitment
);
router.post("/apply/:id", isAuthenticatedLineant, postApplyRecruitment);

export default router;
