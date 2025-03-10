import express from "express";

import { registerUser, verifyUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login");
});
router.get("/signup", (req, res) => {
  res.render("signup");
});
router.post("/signup", registerUser);
router.get("/verify/:token", verifyUser);

export default router;
