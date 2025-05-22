import express from "express";
import passport from "passport";

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
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/"); // Redirect to user dashboard after login
  }
);

export default router;
