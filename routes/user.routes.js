import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/:username", isAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user, title: "Dashboard" });
});

export default router;
