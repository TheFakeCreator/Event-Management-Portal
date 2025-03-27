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
} from "../controllers/admin.controller.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Middleware to ensure only admins can access these routes
router.use(isAuthenticated);
router.use(isAdmin);

//GET routes
router.get("/dashboard", getAdminDashboard);
router.get("/roles", getManageRoles);
router.get("/roles/requests", getRoleRequests);
router.get("/clubs", getManageClubs);
router.get("/clubs/edit/:id", getEditClub);
router.get("/users", getManageUsers);
router.get("/events", getManageEvents);
router.get("/settings", getSettings);
router.get("/logs", getLogs);

// POST routes
router.post("/clubs/create", createClub);
router.post("/clubs/update/:id", editClub);
router.post("/clubs/delete/:id", deleteClub);
router.post("/roles/assign", assignRole);

// Manage Users
router.get("/users", getManageUsers);

export default router;
