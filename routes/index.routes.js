import express from "express";
import { isAuthenticatedLineant } from "../middlewares/authMiddleware.js";
import Event from "../models/event.model.js";

const router = express.Router();

router.get("/", isAuthenticatedLineant, async (req, res) => {
  try {
    const now = new Date();

    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // console.log("Today:", todayStart, "to", todayEnd);

    const ongoingEvents = await Event.find({
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
      $and: [
        {
          $or: [
            { startDate: { $lt: todayStart } },
            { startTime: { $lte: now.toISOString().split("T")[1] } },
          ],
        },
        {
          $or: [
            { endDate: { $gt: todayEnd } },
            { endTime: { $gte: now.toISOString().split("T")[1] } },
          ],
        },
      ],
    });

    const upcomingEvents = await Event.find({
      $or: [
        { startDate: { $gt: todayEnd } }, // Future date
        {
          startDate: { $eq: todayStart }, // Today but after current time
          startTime: { $gt: now.toISOString().split("T")[1] },
        },
      ],
    });

    // console.log("Ongoing Events:", ongoingEvents);
    // console.log("Upcoming Events:", upcomingEvents);

    res.render("index", {
      title: "Event Management Portal",
      isAuthenticated: req.isAuthenticated,
      ongoingEvents,
      upcomingEvents,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Test route for unauthorized users (lineants)
router.get("/test", isAuthenticatedLineant, (req, res) => {
  res.render("unauthorized.ejs", {
    title: "Admin Dashboard",
    isAuthenticated: req.isAuthenticated,
    user: req.user,
  });
});

export default router;
