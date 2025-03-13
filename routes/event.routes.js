import express from "express";
// import Event from "../models/event.model.js";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { createEvent } from "../controllers/event.controller.js";
import Event from "../models/event.model.js";
import Club from "../models/club.model.js";

const router = express.Router();

router.get("/", isAuthenticatedLineant, async (req, res) => {
  try {
    const events = await Event.find({});
    res.render("eventsPage", {
      title: "Event Management Portal",
      events,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    res.status(500).send("Error fetching events");
  }
});

router.get("/create", isAuthenticated, async (req, res) => {
  try {
    const clubs = await Club.find({});
    res.render("createEvent", {
      title: "Create Event",
      clubs,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    res.status(500).send("Error fetching clubs");
  }
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
