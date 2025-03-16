import mongoose from "mongoose";
import Event from "../models/event.model.js";
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
      collaborators: collaboratorsArray,
    });

    res.send(event);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
