import Announcement from "../models/announcement.model.js";
import Club from "../models/club.model.js";

export const getAllAnnouncements = async (req, res) => {
  try {
    const [announcements, clubs] = await Promise.all([
      Announcement.find()
        .populate("postedBy", "name email")
        .populate("club", "name")
        .sort({ createdAt: -1 }),
      req.user && req.user.role === "admin"
        ? Club.find().select("name").sort("name")
        : Promise.resolve(null), // Ensure a promise is always passed
    ]);

    res.render("announcements", {
      title: "Announcements",
      announcements,
      clubs,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).render("error", {
      message: "Error fetching announcements",
      error,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, clubId } = req.body;

    const announcement = new Announcement({
      title,
      message,
      postedBy: req.user._id,
      club: clubId || null,
    });

    await announcement.save();

    res.redirect("/announcements");
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).render("error", {
      message: "Error creating announcement",
      error,
    });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const [announcement, clubs] = await Promise.all([
      Announcement.findById(id).populate("club", "name"),
      Club.find().select("name").sort("name"),
    ]);

    if (!announcement) {
      return res.status(404).render("404", {
        title: "Announcement Not Found",
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }

    res.render("edit-announcement", {
      title: "Edit Announcement",
      announcement,
      clubs,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    console.error("Error fetching announcement for edit:", error);
    res.status(500).render("error", {
      message: "Error fetching announcement",
      error,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, clubId } = req.body;

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        title,
        message,
        club: clubId || null,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedAnnouncement) {
      return res.status(404).render("404", {
        title: "Announcement Not Found",
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }

    res.redirect("/announcements");
  } catch (error) {
    console.error("Error updating announcement:", error);
    // If validation fails, re-render the edit form with errors
    if (error.name === "ValidationError") {
      const [announcement, clubs] = await Promise.all([
        Announcement.findById(req.params.id).populate("club", "name"), // Fetch original to populate form
        Club.find().select("name").sort("name"),
      ]);
      return res.status(400).render("edit-announcement", {
        title: "Edit Announcement",
        announcement: { ...announcement.toObject(), ...req.body }, // Show submitted values
        clubs,
        errors: error.errors,
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }
    res.status(500).render("error", {
      message: "Error updating announcement",
      error,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.redirect("/announcements");
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).render("error", {
      message: "Error deleting announcement",
      error,
    });
  }
};
