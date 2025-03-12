import express from "express";
import passport from "passport";

import {
  registerUser,
  loginUser,
  verifyUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyUser);

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});
router.post("/forgot-password", forgotPassword);

router.get("/reset-password/:token", (req, res) => {
  res.render("reset-password");
});
router.post("/reset-password/:token", resetPassword);

router.get(
  "/google",
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
