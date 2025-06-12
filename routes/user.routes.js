import express from "express";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { profileUpload } from "../middlewares/upload.js";
import {
  getRequestRole,
  getUser,
  getUserEdit,
  postUserEdit,
  requestRole,
} from "../controllers/user.controller.js";
import {
  validateUser,
  validateParams,
  securityMiddleware,
  validateFileUpload,
} from "../middlewares/inputValidationMiddleware.js";
import { protectUserInput } from "../middlewares/xssProtectionMiddleware.js";
import {
  fileUploadRateLimit,
  enhancedFileValidation,
  fileUploadErrorHandler,
} from "../middlewares/fileSecurityMiddleware.js";
import { validateCSRF } from "../middlewares/csrfMiddleware.js";

const router = express.Router();

router.get("/test-error", isAuthenticatedLineant, (req, res, next) => {
  const error = new Error("This is a test error!");
  error.status = 500;
  next(error);
});

// GET Routes
router.get(
  "/:username/edit",
  securityMiddleware,
  validateParams(["username"]),
  isAuthenticated,
  getUserEdit
);
router.get(
  "/:username",
  securityMiddleware,
  validateParams(["username"]),
  isAuthenticated,
  getUser
);
router.get(
  "/:username/request-role",
  securityMiddleware,
  validateParams(["username"]),
  isAuthenticated,
  getRequestRole
);

// POST Routes - with validation and security middleware
router.post(
  "/:username/edit",
  securityMiddleware,
  validateParams(["username"]),
  isAuthenticated,
  validateCSRF,
  fileUploadRateLimit,
  profileUpload.single("avatar"),
  validateFileUpload({ fileTypes: ["image"], maxSize: 2 * 1024 * 1024 }), // 2MB for avatars
  enhancedFileValidation,
  protectUserInput, // XSS protection for user input
  validateUser.updateProfile,
  fileUploadErrorHandler,
  postUserEdit
);
router.post(
  "/:username/request-role",
  securityMiddleware,
  validateParams(["username"]),
  isAuthenticated,
  validateCSRF,
  validateUser.requestRole,
  requestRole
);

export default router;
