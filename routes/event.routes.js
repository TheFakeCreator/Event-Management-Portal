import express from "express";
// import Event from "../models/event.model.js";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { createEvent } from "../controllers/event.controller.js";

const router = express.Router();

router.get("/", isAuthenticatedLineant, (req, res) => {
  res.render("eventsPage", {
    title: "Event Management Portal",
    isAuthenticated: req.isAuthenticated,
  });
});

router.get("/create", isAuthenticated, (req, res) => {
  res.render("createEvent", {
    title: "Create Event",
    isAuthenticated: req.isAuthenticated,
  });
});

router.post("/create", isAuthenticated, createEvent);

// router.get("/", async (req, res) => {
//   const events = await Event.find();
//   res.json(events);
// });

// // Add a new event
// router.post("/", async (req, res) => {
//   const { title, date } = req.body;
//   const event = new Event({ title, date });
//   await event.save();
//   res.json(event);
// });

// // Update event date
// router.put("/:id", async (req, res) => {
//   const { date } = req.body;
//   await Event.findByIdAndUpdate(req.params.id, { date });
//   res.json({ message: "Event updated" });
// });

// // Delete an event
// router.delete("/:id", async (req, res) => {
//   await Event.findByIdAndDelete(req.params.id);
//   res.json({ message: "Event deleted" });
// });

export default router;
