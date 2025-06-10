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

const router = express.Router();

// GET Routes
router.get("/", isAuthenticatedLineant, getEvents);
router.get("/create", isAuthenticated, isModeratorOrAdmin, getCreateEvent);
router.get("/:id", isAuthenticated, getEventDetails);
router.get("/:id/register", isAuthenticated, getEventRegister);
router.get("/:id/edit", isAuthenticated, getEditEvent);
router.get("/:id/participants", isAuthenticated, getEventParticipants);

// POST Routes
router.post("/create", isAuthenticated, isModeratorOrAdmin, createEvent);
router.post("/:id/register", isAuthenticated, registerEvent);
router.post("/:id/delete", isAuthenticated, isModeratorOrAdmin, deleteEvent);
router.post("/:id/edit", isAuthenticated, isModeratorOrAdmin, editEvent);
router.post("/:id/report", isAuthenticated, reportEvent);
router.post(
  "/:id/winners",
  isAuthenticated,
  isModeratorOrAdmin,
  addEventWinners
);

export default router;
