import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import {
  getRequestRole,
  getUser,
  getUserEdit,
  postUserEdit,
  requestRole,
} from "../controllers/user.controller.js";

const router = express.Router();

// GET Routes
router.get("/:username/edit", isAuthenticated, getUserEdit);
router.get("/:username", isAuthenticated, getUser);
router.get("/:username/request-role", isAuthenticated, getRequestRole);

// POST Routes
router.post("/:username/edit", isAuthenticated, postUserEdit);
router.post("/:username/request-role", isAuthenticated, requestRole);
export default router;
