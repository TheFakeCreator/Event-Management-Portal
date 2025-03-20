import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// ✅ Edit Profile Route (Place this BEFORE dashboard route)
router.get("/:username/edit", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("edit-profile", {
      title: "Edit Profile",
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    console.error("Error loading edit profile page:", err);
    res.status(500).send("Error loading page");
  }
});

// ✅ Dashboard Route (Keep it below the edit route)
router.get("/:username", isAuthenticated, (req, res) => {
  res.render("dashboard", {
    user: req.user,
    title: "Dashboard",
    isAuthenticated: req.isAuthenticated,
  });
});

export default router;
