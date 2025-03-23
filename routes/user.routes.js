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
router.post("/:username/edit",isAuthenticated, async (req, res) => {
  try {
    const { name, username, phone, bio, occupation, location, linkedin, github, twitter } = req.body;
    const userId = req.user._id; // Ensure user is authenticated

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        username,
        phone,
        bio,
        occupation,
        location,
        socials: { linkedin, github, twitter },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.redirect(`/user/${updatedUser.username}`); // Redirect to profile page after update
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
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
