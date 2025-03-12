import express from "express";
import Club from "../models/club.model.js";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Fetch all clubs
router.get("/", isAuthenticatedLineant, async (req, res) => {
  try {
    const clubs = await Club.find();
    res.render("clubs", {
      title: "Clubs List",
      clubs,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    res.status(500).send("Error fetching clubs");
  }
});

// Create a new club (Admin only)
router.post("/add", async (req, res) => {
  try {
    const { name, description, contactEmail, logo } = req.body;
    const newClub = new Club({ name, description, contactEmail, logo });
    await newClub.save();
    res.redirect("/clubs");
  } catch (err) {
    res.status(500).send("Error creating club");
  }
});

export default router;
