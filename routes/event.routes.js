import express from "express";
// import Event from "../models/event.model.js";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
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
} from "../controllers/event.controller.js";

const router = express.Router();

// GET Routes
router.get("/", isAuthenticatedLineant, getEvents);
router.get("/create", isAuthenticated, getCreateEvent);
router.get("/:id", isAuthenticated, getEventDetails);
router.get("/:id/register", isAuthenticated, getEventRegister);
router.get("/:id/edit", isAuthenticated, getEditEvent);

// POST Routes
router.post("/create", isAuthenticated, createEvent);
router.post("/:id/register", isAuthenticated, registerEvent);
router.post("/:id/delete", isAuthenticated, deleteEvent);
router.post("/:id/edit", isAuthenticated, editEvent);

export default router;
