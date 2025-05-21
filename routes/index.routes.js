import express from "express";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";
import {
  getAbout,
  getIndex,
  getPrivacy,
} from "../controllers/index.controller.js";

const router = express.Router();

// GET Routes
router.get("/", isAuthenticatedLineant, getIndex);
router.get("/about", isAuthenticatedLineant, getAbout);
router.get("/privacy", isAuthenticatedLineant, getPrivacy);

// Test route for unauthorized users (lineants)
router.get("/test", isAuthenticatedLineant, (req, res) => {
  res.render("unauthorized.ejs", {
    title: "Admin Dashboard",
    isAuthenticated: req.isAuthenticated,
    user: req.user,
  });
});

export default router;
