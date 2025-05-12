import express from "express";
// import Event from "../models/event.model.js";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { createEvent } from "../controllers/event.controller.js";
import Event from "../models/event.model.js";
import Club from "../models/club.model.js";
import Registration from "../models/registration.model.js";

const router = express.Router();

router.get("/", isAuthenticatedLineant, async (req, res) => {
  try {
    const user = req.user;
    const clubs = await Club.find({});

    const events = await Event.find({});
    res.render("eventsPage", {
      title: "Event Management Portal",
      events,
      user,
      clubs,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    res.status(500).send("Error fetching events");
  }
});

router.get("/create", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;

    const clubs = await Club.find({});
    res.render("createEvent", {
      title: "Create Event",
      clubs,
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    res.status(500).send("Error fetching clubs");
  }
});

router.post("/create", isAuthenticated, createEvent);
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("club")
      .populate("collaborators");

    if (!event) {
      return res.status(404).send("Event not found");
    }

    const registeredUsersCount = await Registration.countDocuments({
      event: req.params.id,
    });
    res.render("eventDetails", {
      title: "Event Details",
      event,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
      registeredUsersCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
router.get("/:id/register", isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send("Event not found");
    }

    // Check if the event has already started
    if (new Date() >= new Date(event.startDate)) {
      return res.status(403).render("registrationClose", {
        event,
        title: "Event Registration",
        isAuthenticated: req.isAuthenticated,
        user: req.user,
      });
    }

    res.render("eventRegister", {
      event,
      title: "Event Registration",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Handle event registration
router.post("/:id/register", isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send("Event not found");
    }

    const { name, email, phone } = req.body;

    const newRegistration = await Registration.create({
      event: event._id,
      name,
      email,
      phone,
    });

    res.redirect(`/event/${event._id}`); // Redirect to event details after registration
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

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
