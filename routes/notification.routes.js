import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// Get notification preferences
router.get("/preferences", isAuthenticated, async (req, res) => {
  try {
    res.render("notification-preferences", {
      title: "Notification Preferences",
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    console.error("Error loading notification preferences:", error);
    res.status(500).render("error", {
      message: "Error loading preferences",
      error,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  }
});

// Update notification preferences
router.post("/preferences", isAuthenticated, async (req, res) => {
  try {
    const {
      emailNotifications,
      eventReminders,
      clubUpdates,
      generalAnnouncements,
      recruitmentUpdates,
      weeklyDigest,
    } = req.body;

    const preferences = {
      emailNotifications: emailNotifications === "on",
      eventReminders: eventReminders === "on",
      clubUpdates: clubUpdates === "on",
      generalAnnouncements: generalAnnouncements === "on",
      recruitmentUpdates: recruitmentUpdates === "on",
      weeklyDigest: weeklyDigest === "on",
    };

    await User.findByIdAndUpdate(req.user._id, {
      notificationPreferences: preferences,
    });

    req.flash("success", "Notification preferences updated successfully!");
    res.redirect("/notifications/preferences");
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    req.flash("error", "Error updating preferences. Please try again.");
    res.redirect("/notifications/preferences");
  }
});

export default router;
