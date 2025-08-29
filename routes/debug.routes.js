// Debug route for testing announcement functionality
import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import Club from "../models/club.model.js";
import User from "../models/user.model.js";
import { queueBulkEmails } from "../utils/bulkEmailService.js";

const router = express.Router();

// Test announcement notifications
router.get("/test-announcement", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const clubs = await Club.find().select("name").sort("name");
    const userCount = await User.countDocuments({ emailVerified: true });
    
    res.json({
      message: "Debug info for announcement system",
      clubs: clubs.map(c => ({ id: c._id, name: c.name })),
      totalVerifiedUsers: userCount,
      currentUser: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test email queue
router.post("/test-email-queue", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const testRecipients = [
      { email: req.user.email, name: req.user.name }
    ];

    const result = await queueBulkEmails(
      testRecipients,
      "Test Announcement from Debug Route",
      "announcement",
      {
        title: "Test Announcement",
        message: "This is a test announcement to verify the email system is working.",
        postedBy: req.user.name,
        timestamp: new Date(),
      },
      { priority: "high" }
    );

    res.json({
      message: "Test email queued successfully",
      result: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
