import Club from "../models/club.model.js";
export const createClub = async (req, res) => {
  const { name, description, image, oc } = req.body;
  if (!name || !description || !image) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const newClub = await Club.create({
    name,
    description,
    image,
    // oc,
  });
  res.status(201).json(newClub);
};
