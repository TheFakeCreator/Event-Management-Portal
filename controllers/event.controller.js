import mongoose from "mongoose";
import Event from "../models/event.model.js";
import Club from "../models/club.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import Log from "../models/log.model.js";
import sendEmail from "../utils/sendEmail.js";

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
      req.flash("error", "Event not found");
      return res.redirect("/event");
    }

    let alreadyRegistered = false;
    if (req.user) {
      alreadyRegistered = await EventRegistration.exists({
        event: req.params.id,
        user: req.user._id,
      });
    }

    const registeredUsersCount = await EventRegistration.countDocuments({
      event: req.params.id,
    });
    res.render("eventDetails", {
      title: "Event Details",
      event,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
      registeredUsersCount,
      creator:
        req.user && event.createdBy.toString() == req.user._id.toString()
          ? true
          : false,
      alreadyRegistered,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Server Error");
    res.redirect("/event");
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

    req.flash("success", "Event created successfully!");
    res.redirect("/event");
  } catch (error) {
    console.log(error);
    req.flash("error", "Failed to create event.");
    res.redirect("/event");
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/event");
    }

    // Check if the user is authorized to delete the event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      req.flash("error", "You are not authorized to delete this event.");
      return res.redirect(`/event/${id}`);
    }

    await Event.findByIdAndDelete(event._id);

    const log = await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "EVENT",
      targetId: id,
      details: `Event ${event.title} deleted by ${req.user.name}`,
    });

    req.flash("success", "Event deleted successfully!");
    res.redirect("/event");
  } catch (error) {
    req.flash("error", "Failed to delete event.");
    res.redirect("/event");
  }
};

export const registerEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/event");
    }

    const { name, email, phone } = req.body;

    if (new Date() >= new Date(event.startDate)) {
      req.flash("error", "Registration is closed for this event.");
      return res.redirect(`/event/${event._id}`);
    }

    // Prevent duplicate registration by email for this event
    const alreadyRegistered = await EventRegistration.findOne({
      event: event._id,
      email: email.trim().toLowerCase(),
    });
    if (alreadyRegistered) {
      req.flash("error", "You have already registered for this event.");
      return res.redirect(`/event/${event._id}`);
    }

    await EventRegistration.create({
      event: event._id,
      name,
      email: email.trim().toLowerCase(),
      phone,
      user: req.user ? req.user._id : undefined,
    });

    // Increment registeredUsers count in the Event model
    await Event.findByIdAndUpdate(event._id, { $inc: { registeredUsers: 1 } });

    // Send confirmation email
    try {
      await sendEmail(
        email.trim().toLowerCase(),
        `Registration Confirmation for ${event.title}`,
        `Hello ${name},\n\nYou have successfully registered for the event: ${event.title}.\n\nEvent Details:\nDate: ${event.startDate}\nTime: ${event.startTime} - ${event.endTime}\nLocation: ${event.location}\n\nThank you for registering!\n\nEvent Management Portal`
      );
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    req.flash("success", "Successfully registered for the event!");
    res.redirect(`/event/${event._id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to register for the event.");
    res.redirect(`/event/${req.params.id}`);
  }
};

export const getEditEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("club")
      .populate("collaborators");
    const clubs = await Club.find();
    if (!event) {
      return res.status(404).send("Event not found");
    }
    // Only allow the creator or admin to edit
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).send("You are not authorized to edit this event.");
    }
    res.render("editEvent", {
      title: "Edit Event",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      event,
      clubs,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const editEvent = async (req, res) => {
  try {
    const { id } = req.params;
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

    let normalizedDescription = description
      ? description.replace(/\r\n|\r/g, "\n")
      : "";
    // Only allow the creator or admin to edit
    const event = await Event.findById(id);
    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/event");
    }
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      req.flash("error", "You are not authorized to edit this event.");
      return res.redirect(`/event/${id}`);
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
        req.flash("error", "Invalid collaborators format.");
        return res.redirect(`/event/${id}`);
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description: normalizedDescription,
        type,
        startDate,
        endDate,
        startTime,
        endTime,
        location,
        image,
        club,
        collaborators: collaboratorsArray,
      },
      { new: true }
    );

    if (!updatedEvent) {
      req.flash("error", "Event not found");
      return res.redirect("/event");
    }

    await Log.create({
      user: req.user._id,
      action: "EDIT",
      targetType: "EVENT",
      targetId: id,
      details: `Event ${updatedEvent.title} edited by ${req.user.name}`,
    });

    req.flash("success", "Event updated successfully!");
    res.redirect(`/event/${id}`);
  } catch (error) {
    console.error("Error updating event:", error);
    req.flash("error", "Failed to update event.");
    res.redirect(`/event/${req.params.id}`);
  }
};
