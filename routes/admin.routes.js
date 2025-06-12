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

export default router;
