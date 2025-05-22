import express from "express";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";
import {
  getRequestRole,
  getUser,
  getUserEdit,
  postUserEdit,
  requestRole,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/test-error", isAuthenticatedLineant, (req, res, next) => {
  const error = new Error("This is a test error!");
  error.status = 500;
  next(error);
});
// GET Routes
router.get("/:username/edit", isAuthenticated, getUserEdit);
router.get("/:username", isAuthenticated, getUser);
router.get("/:username/request-role", isAuthenticated, getRequestRole);

// Test route for error handler

// POST Routes
router.post(
  "/:username/edit",
  isAuthenticated,
  upload.single("avatar"),
  postUserEdit
);
router.post("/:username/request-role", isAuthenticated, requestRole);
export default router;
