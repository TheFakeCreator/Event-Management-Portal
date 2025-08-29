import Announcement from "../models/announcement.model.js";
import Club from "../models/club.model.js";
import User from "../models/user.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import { queueBulkEmails } from "../utils/bulkEmailService.js";

export const getAllAnnouncements = async (req, res) => {
  try {
    const [announcements, clubs] = await Promise.all([
      Announcement.find()
        .populate("postedBy", "name email")
        .populate("club", "name")
        .sort({ createdAt: -1 }),
      // Always fetch clubs for admin users, regardless of authentication status
      req.user && req.user.role === "admin"
        ? Club.find().select("name").sort("name")
        : Promise.resolve([]), // Return empty array instead of null
    ]);

    console.log(`📋 Announcements page: Found ${announcements.length} announcements and ${clubs?.length || 0} clubs for user role: ${req.user?.role}`);

    res.render("announcements", {
      title: "Announcements",
      announcements,
      clubs: clubs || [],
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

    // Send notification emails asynchronously
    try {
      await sendAnnouncementNotifications(announcement, req.user);
    } catch (emailError) {
      console.error("Error sending announcement notifications:", emailError);
      // Don't fail the announcement creation if email fails
    }

    req.flash("success", "Announcement created successfully! Email notifications are being sent.");
    res.redirect("/announcements");
  } catch (error) {
    console.error("Error creating announcement:", error);
    req.flash("error", "Error creating announcement. Please try again.");
    res.status(500).render("error", {
      message: "Error creating announcement",
      error,
    });
  }
};

// Helper function to send announcement notifications
const sendAnnouncementNotifications = async (announcement, poster) => {
  try {
    console.log(`📢 Preparing to send announcement notifications for: "${announcement.title}"`);
    
    let recipients = [];
    let clubInfo = null;    if (announcement.club) {
      // Club-specific announcement - get club members
      const club = await Club.findById(announcement.club).populate('currentMembers', 'name email emailVerified notificationPreferences');
      if (club) {
        clubInfo = { name: club.name, id: club._id };
        // Filter for users who want club notifications
        recipients = club.currentMembers.filter(member => 
          member.emailVerified && 
          member.notificationPreferences?.emailNotifications !== false &&
          member.notificationPreferences?.clubUpdates !== false
        );
        console.log(`🎯 Club announcement: ${recipients.length} club members will be notified`);
      }
    } else {
      // General announcement - get all users who want general notifications
      const users = await User.find({
        emailVerified: true,
        'notificationPreferences.emailNotifications': { $ne: false },
        'notificationPreferences.generalAnnouncements': { $ne: false }
      }, 'name email');
      
      recipients = users;
      console.log(`📋 General announcement: ${recipients.length} users will be notified`);
    }

    if (recipients.length === 0) {
      console.log("⚠️ No recipients found for announcement notifications");
      return;
    }

    // Prepare email data
    const emailData = {
      title: announcement.title,
      message: announcement.message,
      clubName: clubInfo?.name,
      postedBy: poster.name,
      timestamp: announcement.createdAt,
    };

    const subject = clubInfo 
      ? `New Announcement from ${clubInfo.name}: ${announcement.title}`
      : `New Announcement: ${announcement.title}`;

    // Queue bulk emails
    const result = await queueBulkEmails(
      recipients,
      subject,
      'announcement',
      emailData,
      { priority: 'high' }
    );

    console.log(`✅ Announcement notifications queued: ${result.message}`);
    return result;

  } catch (error) {
    console.error("Error in sendAnnouncementNotifications:", error);
    throw error;
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
