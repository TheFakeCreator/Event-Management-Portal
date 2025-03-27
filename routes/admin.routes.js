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
  createClub,
  editClub,
  deleteClub,
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

// POST routes
router.post("/clubs", createClub);
router.post("/clubs/update/:id", editClub);
router.post("/clubs/:id", deleteClub);

// Manage Users
router.get("/users", getManageUsers);

export default router;
