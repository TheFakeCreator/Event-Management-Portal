import Club from "../models/club.model.js";
import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import Log from "../models/log.model.js";
import cloudinary from "../configs/cloudinary.js";

// Helper function to extract public_id from Cloudinary URL (copied from club.routes.js)
const extractPublicId = (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== "string") {
      return null;
    }

    // Handle different Cloudinary URL formats
    const urlParts = cloudinaryUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    // Get everything after 'upload', skipping version if present
    let pathAfterUpload = urlParts.slice(uploadIndex + 1);

    // Remove version if it starts with 'v' followed by numbers
    if (pathAfterUpload.length > 0 && /^v\d+$/.test(pathAfterUpload[0])) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }

    // Join the remaining parts and remove file extension
    const fullPath = pathAfterUpload.join("/");
    const publicId = fullPath.replace(/\.[^.]+$/, ""); // Remove file extension

    return publicId || null;
  } catch (error) {
    console.error("Error extracting public_id from Cloudinary URL:", error);
    return null;
  }
};

// GET Routes
export const getAdminDashboard = (req, res) => {
  res.render("admin/dashboard", {
    title: "Admin Dashboard",
    isAuthenticated: req.isAuthenticated,
    user: req.user,
    success: req.flash("success"),
    error: req.flash("error"),
  });
};

export const getManageRoles = async (req, res, next) => {
  try {
    const users = await User.find();
    res.render("admin/manageRoles", {
      title: "Manage Roles",
      isAuthenticated: req.isAuthenticated,
      users,
      user: req.user,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getRoleRequests = async (req, res, next) => {
  try {
    const users = await User.find({ roleRequest: "admin" });
    if (!users) {
      const err = new Error("No role requests found");
      err.status = 404;
      return next(err);
    }
    res.render("admin/roleRequests", {
      title: "Role Requests",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      users,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getManageClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find();
    res.render("admin/manageClubs", {
      title: "Manage Clubs",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      clubs,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getEditClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id).populate(
      "moderators",
      "name email"
    );
    const users = await User.find({}, "name email");
    if (!club) {
      const err = new Error("Club not found");
      err.status = 404;
      return next(err);
    }
    res.render("admin/editClub", {
      title: "Edit Club",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      club,
      users, // Pass all users for moderator selection
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getManageUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.render("admin/manageUsers", {
      title: "Manage Users",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      users,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getManageEvents = async (req, res, next) => {
  try {
    // Populate createdBy with user name
    const events = await Event.find().populate({
      path: "createdBy",
      select: "name",
    });
    res.render("admin/manageEvents", {
      title: "Manage Events",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      events,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getEditEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("club")
      .populate("collaborators")
      .populate("eventLeads", "name email");
    const clubs = await Club.find()
      .populate("currentMembers", "name email")
      .populate("moderators", "name email");
    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/admin/events");
    }
    res.render("admin/editEvent", {
      title: "Edit Event",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      event,
      clubs,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getSettings = (req, res, next) => {
  try {
    res.render("admin/settings", {
      title: "Settings",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const logs = await Log.find();
    res.render("admin/logs", {
      title: "Logs",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      logs,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    next(error);
  }
};

// POST Routes
// Assign Role to a User
export const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/roles");
    }

    user.role = role;
    await Log.create({
      user: req.user._id,
      affectedUser: userId,
      action: "EDIT",
      targetType: "USER",
      targetId: userId,
      details: `Role of ${userId} updated to ${role} by ${req.user.name}`,
    });
    await user.save();
    req.flash("success", "Role updated successfully");
    res.redirect("/admin/roles");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/roles");
  }
};

export const approveRoleRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/roles/requests");
    }

    user.role = user.roleRequest;
    user.roleRequest = null;
    await Log.create({
      user: req.user._id,
      affectedUser: userId,
      action: "EDIT",
      targetType: "USER",
      targetId: userId,
      details: `Role request of ${userId} approved by ${req.user.name}`,
    });
    await user.save();
    req.flash("success", "Role request approved successfully");
    res.redirect("/admin/roles/requests");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/roles/requests");
  }
};

export const rejectRoleRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/roles/requests");
    }

    user.roleRequest = null;
    await Log.create({
      user: req.user._id,
      affectedUser: userId,
      action: "EDIT",
      targetType: "USER",
      targetId: userId,
      details: `Role request of ${userId} rejected by ${req.user.name}`,
    });
    await user.save();
    req.flash("success", "Role request rejected successfully");
    res.redirect("/admin/roles/requests");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/roles/requests");
  }
};

// Create a New Club
export const createClub = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const club = await Club.create({ name, description, image });
    await Log.create({
      user: req.user._id,
      action: "CREATE",
      targetType: "CLUB",
      targetId: club._id,
      details: `Club ${club.name} created by ${req.user.name}`,
    });
    req.flash("success", "Club created successfully");
    res.redirect("/admin/clubs");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/clubs");
  }
};

// Edit Club Details
export const editClub = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      about,
      image,
      banner,
      domains,
      social = {},
    } = req.body;

    // Ensure domains is always an array
    let domainsArray = [];
    if (Array.isArray(domains)) {
      domainsArray = domains.filter(Boolean);
    } else if (typeof domains === "string" && domains.trim() !== "") {
      domainsArray = [domains.trim()];
    }

    // Social fields: ensure all keys exist
    const socialObj = {
      email: social.email || "",
      instagram: social.instagram || "",
      facebook: social.facebook || "",
      linkedin: social.linkedin || "",
      discord: social.discord || "",
    };

    const club = await Club.findByIdAndUpdate(
      id,
      {
        name,
        description,
        about,
        image,
        banner,
        domains: domainsArray,
        social: socialObj,
      },
      { new: true }
    );
    if (!club) {
      req.flash("error", "Club not found");
      return res.redirect("/admin/clubs");
    }
    await Log.create({
      user: req.user._id,
      action: "EDIT",
      targetType: "CLUB",
      targetId: id,
      details: `Club ${club.name} edited by ${req.user.name}`,
    });
    req.flash("success", "Club updated successfully");
    res.redirect("/admin/clubs");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/clubs");
  }
};

// Delete a Club
export const deleteClub = async (req, res) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id);
    if (!club) {
      req.flash("error", "Club not found");
      return res.redirect("/admin/clubs");
    }

    // Clean up Cloudinary images before deleting from database
    const imagesToDelete = [];

    // Add club display image
    if (club.image) {
      const displayImagePublicId = extractPublicId(club.image);
      if (displayImagePublicId) imagesToDelete.push(displayImagePublicId);
    }

    // Add club banner image
    if (club.banner) {
      const bannerPublicId = extractPublicId(club.banner);
      if (bannerPublicId) imagesToDelete.push(bannerPublicId);
    }

    // Add all gallery images
    if (club.gallery && club.gallery.length > 0) {
      club.gallery.forEach((galleryItem) => {
        if (galleryItem.url) {
          const galleryPublicId = extractPublicId(galleryItem.url);
          if (galleryPublicId) imagesToDelete.push(galleryPublicId);
        }
      });
    }

    // Delete all images from Cloudinary
    if (imagesToDelete.length > 0) {
      console.log(
        `Attempting to delete ${imagesToDelete.length} images from Cloudinary for club: ${club.name}`
      );

      for (const publicId of imagesToDelete) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(
            `Successfully deleted image from Cloudinary: ${publicId}`
          );
        } catch (cloudinaryError) {
          console.error(
            `Error deleting image ${publicId} from Cloudinary:`,
            cloudinaryError
          );
          // Continue with other deletions
        }
      }
    }

    // Delete club from database
    await Club.findByIdAndDelete(id);

    await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "CLUB",
      targetId: id,
      details: `Club ${club.name} deleted by ${req.user.name} (${imagesToDelete.length} images cleaned from Cloudinary)`,
    });
    req.flash(
      "success",
      `Club deleted successfully. ${imagesToDelete.length} images cleaned from storage.`
    );
    res.redirect("/admin/clubs");
  } catch (error) {
    console.error("Error in deleteClub:", error);
    req.flash("error", "Server error");
    res.redirect("/admin/clubs");
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/users");
    }

    // Clean up user avatar from Cloudinary before deleting from database
    if (user.avatar) {
      const avatarPublicId = extractPublicId(user.avatar);
      if (avatarPublicId) {
        try {
          await cloudinary.uploader.destroy(avatarPublicId);
          console.log(
            `Successfully deleted user avatar from Cloudinary: ${avatarPublicId}`
          );
        } catch (cloudinaryError) {
          console.error(
            `Error deleting user avatar from Cloudinary:`,
            cloudinaryError
          );
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }
    }

    // Delete user from database
    await User.findByIdAndDelete(userId);

    await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "USER",
      targetId: userId,
      details: `User ${user.name} deleted by ${req.user.name} (avatar cleaned from Cloudinary)`,
    });
    req.flash("success", "User deleted successfully");
    res.redirect("/admin/users");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/users");
  }
};

//Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/admin/events");
    }

    // Clean up Cloudinary image before deleting from database
    if (event.image) {
      const eventImagePublicId = extractPublicId(event.image);
      if (eventImagePublicId) {
        try {
          await cloudinary.uploader.destroy(eventImagePublicId);
          console.log(
            `Successfully deleted event image from Cloudinary: ${eventImagePublicId}`
          );
        } catch (cloudinaryError) {
          console.error(
            `Error deleting event image from Cloudinary:`,
            cloudinaryError
          );
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }
    }

    // Delete event from database
    await Event.findByIdAndDelete(id);

    await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "EVENT",
      targetId: id,
      details: `Event ${event.title} deleted by ${req.user.name} (image cleaned from Cloudinary)`,
    });
    req.flash("success", "Event deleted successfully");
    res.redirect("/admin/events");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/events");
  }
};

// Edit Event
export const editEvent = async (req, res) => {
  try {
    const { id } = req.params;
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
      eventLeads,
      sponsors,
    } = req.body; // Handle event leads
    let eventLeadsArray = [];
    if (eventLeads) {
      try {
        // Check if eventLeads is a JSON string (new dropdown format) or array (legacy email format)
        if (typeof eventLeads === "string" && eventLeads.startsWith("[")) {
          // New format: JSON array of user IDs
          const parsedEventLeads = JSON.parse(eventLeads);
          if (Array.isArray(parsedEventLeads)) {
            eventLeadsArray = parsedEventLeads.map(
              (id) => new mongoose.Types.ObjectId(id)
            );
          }
        } else {
          // Legacy format: array of emails from form fields
          const emailsArray = Array.isArray(eventLeads)
            ? eventLeads
            : [eventLeads];

          // Find users by email
          const users = await User.find({
            email: {
              $in: emailsArray.filter((email) => email && email.trim()),
            },
          });

          eventLeadsArray = users.map((user) => user._id);
        }
      } catch (error) {
        console.error("Error processing event leads:", error);
      }
    }

    // Handle sponsors
    let sponsorsArray = [];
    if (sponsors) {
      try {
        // Sponsors come as indexed form data, need to reconstruct array
        const sponsorKeys = Object.keys(req.body).filter((key) =>
          key.startsWith("sponsors[")
        );
        const sponsorsByIndex = {};

        sponsorKeys.forEach((key) => {
          const match = key.match(/sponsors\[(\d+)\]\[(\w+)\]/);
          if (match) {
            const index = match[1];
            const field = match[2];
            if (!sponsorsByIndex[index]) sponsorsByIndex[index] = {};
            sponsorsByIndex[index][field] = req.body[key];
          }
        });

        sponsorsArray = Object.values(sponsorsByIndex).filter(
          (sponsor) => sponsor.name && sponsor.name.trim()
        );
      } catch (error) {
        console.error("Error processing sponsors:", error);
      }
    }

    const event = await Event.findByIdAndUpdate(
      id,
      {
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
        collaborators: Array.isArray(collaborators)
          ? collaborators
          : typeof collaborators === "string" && collaborators.startsWith("[")
          ? JSON.parse(collaborators)
          : typeof collaborators === "string"
          ? [collaborators]
          : [],
        eventLeads: eventLeadsArray,
        sponsors: sponsorsArray,
      },
      { new: true }
    );

    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/admin/events");
    }

    await Log.create({
      user: req.user._id,
      action: "EDIT",
      targetType: "EVENT",
      targetId: id,
      details: `Event ${event.title} edited by ${req.user.name}`,
    });

    req.flash("success", "Event updated successfully");
    res.redirect("/admin/events");
  } catch (error) {
    req.flash("error", "An error occurred while updating the event");
    res.redirect("/admin/mevents");
  }
};

// Add Moderator to Club
export const addModeratorToClub = async (req, res) => {
  try {
    const { id } = req.params; // club id
    const { userId } = req.body;
    const club = await Club.findById(id);
    const user = await User.findById(userId);
    if (!club || !user) {
      req.flash("error", "Club or user not found");
      return res.redirect(`/admin/clubs/edit/${id}`);
    }
    // Add user to moderators if not already
    if (!club.moderators.map((m) => m.toString()).includes(userId)) {
      club.moderators.push(userId);
      await club.save();
    }
    // Add club to user's moderatorClubs if not already
    if (!user.moderatorClubs.map((c) => c.toString()).includes(id)) {
      user.moderatorClubs.push(id);
      user.role = "moderator"; // Optionally set role
      await user.save();
    }
    req.flash("success", "Moderator added to club successfully");
    res.redirect(`/admin/clubs/edit/${id}`);
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect(`/admin/clubs/edit/${req.params.id}`);
  }
};

// Remove Moderator from Club
export const removeModeratorFromClub = async (req, res) => {
  try {
    const { id } = req.params; // club id
    const { userId } = req.body;
    const club = await Club.findById(id);
    const user = await User.findById(userId);
    if (!club || !user) {
      req.flash("error", "Club or user not found");
      return res.redirect(`/admin/clubs/edit/${id}`);
    }
    // Remove user from moderators
    club.moderators = club.moderators.filter((m) => m.toString() !== userId);
    await club.save();
    // Remove club from user's moderatorClubs
    user.moderatorClubs = user.moderatorClubs.filter(
      (c) => c.toString() !== id
    );
    // Optionally downgrade role if not moderator of any club
    if (user.moderatorClubs.length === 0 && user.role === "moderator") {
      user.role = "user";
    }
    await user.save();
    req.flash("success", "Moderator removed from club successfully");
    res.redirect(`/admin/clubs/edit/${id}`);
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect(`/admin/clubs/edit/${req.params.id}`);
  }
};
