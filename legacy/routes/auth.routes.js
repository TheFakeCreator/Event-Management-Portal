import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

import {
  registerUser,
  loginUser,
  logoutUser,
  verifyUser,
  forgotPassword,
  resetPassword,
  getLoginUser,
  getRegisterUser,
  getForgotPass,
  getResetPass,
} from "../controllers/auth.controller.js";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET Routes
router.get("/login", isAuthenticatedLineant, getLoginUser);
router.get("/signup", isAuthenticatedLineant, getRegisterUser);
router.get("/verify/:token", verifyUser);
router.get("/forgot-password", isAuthenticatedLineant, getForgotPass);
router.get("/reset-password/:token", isAuthenticatedLineant, getResetPass);

// POST Routes
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get(
  "/google",
  (req, res, next) => {
    // Store the redirect URL in session before OAuth
    if (req.query.redirect) {
      req.session.redirectUrl = req.query.redirect;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/"); // Redirect to user dashboard after login
  }
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Set JWT token cookie for Google OAuth login
    const jwtToken = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 1000, // 1 day
    });

    // Get the redirect URL from session
    const redirectUrl = req.session.redirectUrl;
    if (redirectUrl) {
      // Clear the redirect URL from session
      delete req.session.redirectUrl;
      // Ensure the redirect URL is safe
      if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
        return res.redirect(redirectUrl);
      }
    }

    // Default redirect to user profile
    res.redirect(`/user/${req.user.username}`);
  }
);

export default router;
