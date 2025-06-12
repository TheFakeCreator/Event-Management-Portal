import express from "express";
// import Event from "../models/event.model.js";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { isModeratorOrAdmin } from "../middlewares/moderatorMiddleware.js";
import {
  getCreateEvent,
  createEvent,
  deleteEvent,
  getEvents,
  getEventDetails,
  getEventRegister,
  registerEvent,
  getEditEvent,
  editEvent,
  getEventParticipants,
  reportEvent,
  addEventWinners,
} from "../controllers/event.controller.js";
import {
  validateEvent,
  validateParams,
  validateQuery,
  securityMiddleware,
  validateFileUpload,
} from "../middlewares/inputValidationMiddleware.js";
import {
  protectEventInput,
  protectSearchInput,
} from "../middlewares/xssProtectionMiddleware.js";

const router = express.Router();

// GET Routes
router.get(
  "/",
  securityMiddleware,
  validateQuery(["search", "category", "page", "limit"]),
  isAuthenticatedLineant,
  getEvents
);
router.get(
  "/create",
  securityMiddleware,
  isAuthenticated,
  isModeratorOrAdmin,
  getCreateEvent
);
router.get(
  "/:id",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  getEventDetails
);
router.get(
  "/:id/register",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  getEventRegister
);
router.get(
  "/:id/edit",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  getEditEvent
);
router.get(
  "/:id/participants",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  getEventParticipants
);

// POST Routes - with validation and security middleware
router.post(
  "/create",
  securityMiddleware,
  isAuthenticated,
  isModeratorOrAdmin,
  protectEventInput, // XSS protection for event data
  validateEvent.create,
  createEvent
);
router.post(
  "/:id/register",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  validateEvent.register,
  registerEvent
);
router.post(
  "/:id/delete",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  isModeratorOrAdmin,
  deleteEvent
);
router.post(
  "/:id/edit",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  isModeratorOrAdmin,
  protectEventInput, // XSS protection for event updates
  validateEvent.update,
  editEvent
);
router.post(
  "/:id/report",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  validateEvent.report,
  reportEvent
);
router.post(
  "/:id/winners",
  securityMiddleware,
  validateParams(["id"]),
  isAuthenticated,
  isModeratorOrAdmin,
  addEventWinners
);

export default router;
