import Club from "../models/club.model.js";
import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import Log from "../models/log.model.js";

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
    const club = await Club.findById(req.params.id);
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
      .populate("collaborators");
    const clubs = await Club.find();
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
    const club = await Club.findByIdAndDelete(id);
    if (!club) {
      req.flash("error", "Club not found");
      return res.redirect("/admin/clubs");
    }
    await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "CLUB",
      targetId: id,
      details: `Club ${club.name} deleted by ${req.user.name}`,
    });
    req.flash("success", "Club deleted successfully");
    res.redirect("/admin/clubs");
  } catch (error) {
    req.flash("error", "Server error");
    res.redirect("/admin/clubs");
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/users");
    }
    await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "USER",
      targetId: userId,
      details: `User ${user.name} deleted by ${req.user.name}`,
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
    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/admin/events");
    }
    await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "EVENT",
      targetId: id,
      details: `Event ${event.title} deleted by ${req.user.name}`,
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
    } = req.body;

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
