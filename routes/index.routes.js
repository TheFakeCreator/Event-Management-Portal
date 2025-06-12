import express from "express";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";
import {
  getAbout,
  getIndex,
  getPrivacy,
} from "../controllers/index.controller.js";
import { securityMiddleware } from "../middlewares/inputValidationMiddleware.js";

const router = express.Router();

// GET Routes
router.get("/", securityMiddleware, isAuthenticatedLineant, getIndex);
router.get("/about", securityMiddleware, isAuthenticatedLineant, getAbout);
router.get("/privacy", securityMiddleware, isAuthenticatedLineant, getPrivacy);

// Test route for unauthorized users (lineants)
router.get("/test", securityMiddleware, isAuthenticatedLineant, (req, res) => {
  res.render("landingPage", {
    title: "Admin Dashboard",
    isAuthenticated: req.isAuthenticated,
    user: req.user,
  });
});

export default router;
