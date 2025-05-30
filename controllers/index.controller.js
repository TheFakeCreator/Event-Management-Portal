import Event from "../models/event.model.js";
export const getIndex = async (req, res) => {
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
    }).populate("club");

    const upcomingEvents = await Event.find({
      $or: [
        { startDate: { $gt: todayEnd } }, // Future date
        {
          startDate: { $eq: todayStart }, // Today but after current time
          startTime: { $gt: now.toISOString().split("T")[1] },
        },
      ],
    }).populate("club");

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
};

export const getAbout = (req, res) => {
  try {
    res.render("about.ejs", {
      title: "About",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading about page:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getPrivacy = (req, res) => {
  try {
    res.render("privacyPolicy.ejs", {
      title: "Privacy Policy",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading privacy page:", error);
    res.status(500).send("Internal Server Error");
  }
};
