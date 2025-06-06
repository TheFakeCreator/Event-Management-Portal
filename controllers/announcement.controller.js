import Announcement from "../models/announcement.model.js";
import Club from "../models/club.model.js";

export const getAllAnnouncements = async (req, res) => {
  try {
    const [announcements, clubs] = await Promise.all([
      Announcement.find()
        .populate("postedBy", "name email")
        .populate("club", "name")
        .sort({ createdAt: -1 }),
      req.user?.isAdmin ? Club.find().select("name").sort("name") : null
    ]);
    
    res.render("announcements", {
      title: "Announcements",
      announcements,
      clubs,
      user: req.user,
      isAuthenticated: req.isAuthenticated
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).render("error", {
      message: "Error fetching announcements",
      error,
      user: req.user,
      isAuthenticated: req.isAuthenticated
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
      club: clubId || null
    });

    await announcement.save();
    
    res.redirect("/announcements");
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).render("error", {
      message: "Error creating announcement",
      error
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
      error
    });
  }
};
