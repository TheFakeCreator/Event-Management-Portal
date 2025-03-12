import express from "express";
import passport from "passport";

import {
  registerUser,
  loginUser,
  logoutUser,
  verifyUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/login", isAuthenticatedLineant, (req, res) => {
  if (req.isAuthenticated) {
    return res.redirect(`/user/${req.user.username}`);
  }
  res.render("login");
});

router.get("/signup", isAuthenticatedLineant, (req, res) => {
  if (req.isAuthenticated) {
    return res.redirect(`/user/${req.user.username}`);
  }
  res.render("signup");
});

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/verify/:token", verifyUser);

router.get("/forgot-password", isAuthenticatedLineant, (req, res) => {
  if (req.isAuthenticated) {
    return res.redirect(`/user/${req.user.username}`);
  }
  res.render("forgot-password");
});
router.post("/forgot-password", forgotPassword);

router.get("/reset-password/:token", isAuthenticatedLineant, (req, res) => {
  if (req.isAuthenticated) {
    return res.redirect(`/user/${req.user.username}`);
  }
  res.render("reset-password");
});
router.post("/reset-password/:token", resetPassword);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    successRedirect: "/dashboard",
  })
);

export default router;
