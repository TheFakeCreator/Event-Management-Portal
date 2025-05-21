import mongoose from "mongoose";
import Event from "../models/event.model.js";
import Club from "../models/club.model.js";
import Registration from "../models/registration.model.js";
import Log from "../models/log.model.js";

export const getEvents = async (req, res) => {
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
};

export const getCreateEvent = async (req, res) => {
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
};

export const getEventDetails = async (req, res) => {
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
      creator:
        event.createdBy.toString() == req.user._id.toString() ? true : false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

export const getEventRegister = async (req, res) => {
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
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      image,
      club,
      collaborators,
    } = req.body;

    if (
      !title ||
      !description ||
      !type ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !location ||
      !image ||
      !club
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let collaboratorsArray = [];
    if (collaborators) {
      try {
        const parsedCollaborators = JSON.parse(collaborators);
        if (Array.isArray(parsedCollaborators)) {
          collaboratorsArray = parsedCollaborators.map(
            (id) => new mongoose.Types.ObjectId(id)
          );
        }
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid collaborators format." });
      }
    }
    console.log(req.body);
    const event = await Event.create({
      title,
      description,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      image,
      club,
      createdBy: req.user._id,
      collaborators: collaboratorsArray,
    });

    const log = await Log.create({
      user: req.user._id,
      action: "CREATE",
      targetType: "EVENT",
      targetId: event._id,
      details: `Event ${event.title} created by ${req.user.name}`,
    });

    res.send(event);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check if the user is authorized to delete the event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this event." });
    }

    await Event.findByIdAndDelete(event._id);

    const log = await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "EVENT",
      targetId: id,
      details: `Event ${event.title} deleted by ${req.user.name}`,
    });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const registerEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send("Event not found");
    }

    const { name, email, phone } = req.body;

    if (new Date() >= new Date(event.startDate)) {
      return res.status(403).json({
        event,
        title: "Event Registration",
        isAuthenticated: req.isAuthenticated,
        user: req.user,
      });
    }

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
};
