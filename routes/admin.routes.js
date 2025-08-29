import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import {
  getAdminDashboard,
  getManageRoles,
  getManageClubs,
  getEditClub,
  getManageUsers,
  getManageEvents,
  getRoleRequests,
  getSettings,
  getLogs,
  createClub,
  editClub,
  deleteClub,
  assignRole,
  approveRoleRequest,
  rejectRoleRequest,
  deleteUser,
  getEditEvent,
  deleteEvent,
  editEvent,
  addModeratorToClub,
  removeModeratorFromClub,
} from "../controllers/admin.controller.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  validateAdmin,
  validateParams,
  validateQuery,
  securityMiddleware,
} from "../middlewares/inputValidationMiddleware.js";
import { validateSensitiveCSRF } from "../middlewares/csrfMiddleware.js";

import { getQueueStats, cleanupOldEmails } from "../utils/bulkEmailService.js";
import EmailQueue from "../models/emailQueue.model.js";

const router = express.Router();

// Middleware to ensure only admins can access these routes
router.use(securityMiddleware);
router.use(isAuthenticated);
router.use(isAdmin);

//GET routes
router.get("/dashboard", getAdminDashboard);
router.get(
  "/roles",
  validateQuery(["search", "page", "limit"]),
  getManageRoles
);
router.get(
  "/roles/requests",
  validateQuery(["page", "limit"]),
  getRoleRequests
);
router.get(
  "/clubs",
  validateQuery(["search", "page", "limit"]),
  getManageClubs
);
router.get("/clubs/edit/:id", validateParams(["id"]), getEditClub);
router.get(
  "/users",
  validateQuery(["search", "role", "page", "limit"]),
  getManageUsers
);
router.get(
  "/events",
  validateQuery(["search", "status", "page", "limit"]),
  getManageEvents
);
router.get("/events/edit/:id", validateParams(["id"]), getEditEvent);
router.get("/settings", getSettings);
router.get(
  "/logs",
  validateQuery(["level", "startDate", "endDate", "page", "limit"]),
  getLogs
);

// POST routes
router.post(
  "/clubs/create",
  validateSensitiveCSRF,
  validateAdmin.createClub,
  createClub
);
router.post(
  "/clubs/update/:id",
  validateParams(["id"]),
  validateSensitiveCSRF,
  validateAdmin.updateClub,
  editClub
);
router.post(
  "/clubs/delete/:id",
  validateParams(["id"]),
  validateSensitiveCSRF,
  deleteClub
);
router.post(
  "/roles/assign",
  validateSensitiveCSRF,
  validateAdmin.assignRole,
  assignRole
);
router.post(
  "/roles/approve/:userId",
  validateParams(["userId"]),
  validateSensitiveCSRF,
  approveRoleRequest
);
router.post(
  "/roles/deny/:userId",
  validateParams(["userId"]),
  validateSensitiveCSRF,
  rejectRoleRequest
);
router.post(
  "/users/delete/:userId",
  validateParams(["userId"]),
  validateSensitiveCSRF,
  deleteUser
);
router.post(
  "/events/delete/:id",
  validateParams(["id"]),
  validateSensitiveCSRF,
  deleteEvent
);
router.post(
  "/events/edit/:id",
  validateParams(["id"]),
  validateSensitiveCSRF,
  validateAdmin.editEvent,
  editEvent
);
router.post(
  "/clubs/:id/add-moderator",
  validateParams(["id"]),
  validateSensitiveCSRF,
  validateAdmin.addModerator,
  addModeratorToClub
);
router.post(
  "/clubs/:id/remove-moderator",
  validateParams(["id"]),
  validateSensitiveCSRF,
  validateAdmin.removeModerator,
  removeModeratorFromClub
);

// Manage Users
router.get(
  "/users",
  validateQuery(["search", "role", "page", "limit"]),
  getManageUsers
);

router.get("/email-queue", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const stats = await getQueueStats();

    // Get recent emails for display
    const recentEmails = await EmailQueue.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get failed emails
    const failedEmails = await EmailQueue.find({ status: "failed" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.render("admin/email-queue", {
      title: "Email Queue Management",
      stats,
      recentEmails,
      failedEmails,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    console.error("Error loading email queue dashboard:", error);
    res.status(500).render("error", {
      message: "Error loading email queue dashboard",
      error,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  }
});

// Cleanup old emails
router.post(
  "/email-queue/cleanup",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const { days } = req.body;
      const daysOld = parseInt(days) || 30;

      const result = await cleanupOldEmails(daysOld);

      req.flash(
        "success",
        `Cleaned up ${result.deletedCount} old email records (older than ${daysOld} days)`
      );
      res.redirect("/admin/email-queue");
    } catch (error) {
      console.error("Error cleaning up emails:", error);
      req.flash("error", "Error cleaning up emails. Please try again.");
      res.redirect("/admin/email-queue");
    }
  }
);

// Retry failed emails
router.post(
  "/email-queue/retry-failed",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const result = await EmailQueue.updateMany(
        { status: "failed", retryCount: { $lt: 3 } },
        {
          $set: { status: "pending" },
          $unset: { nextRetry: 1, error: 1 },
        }
      );

      req.flash(
        "success",
        `${result.modifiedCount} failed emails marked for retry`
      );
      res.redirect("/admin/email-queue");
    } catch (error) {
      console.error("Error retrying failed emails:", error);
      req.flash("error", "Error retrying failed emails. Please try again.");
      res.redirect("/admin/email-queue");
    }
  }
);

export default router;
