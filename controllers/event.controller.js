import mongoose from "mongoose";
import Event from "../models/event.model.js";
import Log from "../models/log.model.js";
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
      targetId: id,
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
