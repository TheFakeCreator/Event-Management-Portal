import Event from "../models/event.model.js";
export const createEvent = async (req, res) => {
  const {
    title,
    description,
    type,
    date,
    time,
    location,
    image,
    club,
    collaborators,
  } = req.body;
  const event = await Event.create({
    title,
    description,
    type,
    date,
    time,
    location,
    image,
    club,
    collaborators,
  });
  if (
    !title ||
    !description ||
    !type ||
    !date ||
    !time ||
    !location ||
    !image ||
    !club
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  res.send(event);
};
