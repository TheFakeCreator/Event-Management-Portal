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
  });
};

export const getManageRoles = async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin/manageRoles", {
      title: "Manage Roles",
      isAuthenticated: req.isAuthenticated,
      users,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getRoleRequests = async (req, res) => {
  try {
    const users = await User.find({ roleRequest: "admin" });
    if (!users) {
      return res.status(404).send("No role requests found");
    }
    res.render("admin/roleRequests", {
      title: "Role Requests",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      users,
    });
  } catch (error) {
    console.error("Error fetching role requests:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getManageClubs = async (req, res) => {
  try {
    const clubs = await Club.find();
    res.render("admin/manageClubs", {
      title: "Manage Clubs",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      clubs,
    });
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getEditClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).send("Club not found");
    }
    res.render("admin/editClub", {
      title: "Edit Club",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      club,
    });
  } catch (error) {
    console.error("Error fetching club:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getManageUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin/manageUsers", {
      title: "Manage Users",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getManageEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.render("admin/manageEvents", {
      title: "Manage Events",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getSettings = (req, res) => {
  try {
    res.render("admin/settings", {
      title: "Settings",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getLogs = async (req, res) => {
  try {
    const logs = await Log.find();
    res.render("admin/logs", {
      title: "Logs",
      isAuthenticated: req.isAuthenticated,
      user: req.user,
      logs,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).send("Internal Server Error");
  }
};

// POST Routes
// Assign Role to a User
export const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    const log = await Log.create({
      user: req.user._id,
      affectedUser: userId,
      action: "EDIT",
      targetType: "USER",
      targetId: userId,
      details: `Role of ${userId} updated to ${role} by ${req.user.name}`,
    });
    await user.save();
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const approveRoleRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = user.roleRequest;
    user.roleRequest = null;
    const log = await Log.create({
      user: req.user._id,
      affectedUser: userId,
      action: "EDIT",
      targetType: "USER",
      targetId: userId,
      details: `Role request of ${userId} approved by ${req.user.name}`,
    });
    await user.save();
    res.json({ message: "Role request approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectRoleRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.roleRequest = null;
    const log = await Log.create({
      user: req.user._id,
      affectedUser: userId,
      action: "EDIT",
      targetType: "USER",
      targetId: userId,
      details: `Role request of ${userId} rejected by ${req.user.name}`,
    });
    await user.save();
    res.json({ message: "Role request rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create a New Club
export const createClub = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const club = await Club.create({ name, description, image });
    const log = await Log.create({
      user: req.user._id,
      action: "CREATE",
      targetType: "CLUB",
      targetId: club._id,
      details: `Club ${club.name} created by ${req.user.name}`,
    });
    res.json({ message: "Club created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Edit Club Details
export const editClub = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const club = await Club.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    if (!club) return res.status(404).json({ message: "Club not found" });
    const log = await Log.create({
      user: req.user._id,
      action: "EDIT",
      targetType: "CLUB",
      targetId: id,
      details: `Club ${club.name} edited by ${req.user.name}`,
    });
    res.json({ message: "Club updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a Club
export const deleteClub = async (req, res) => {
  try {
    const { id } = req.params;
    const club = await Club.findByIdAndDelete(id);
    if (!club) return res.status(404).json({ message: "Club not found" });
    const log = await Log.create({
      user: req.user._id,
      action: "DELETE",
      targetType: "CLUB",
      targetId: id,
      details: `Club ${club.name} deleted by ${req.user.name}`,
    });
    res.json({ message: "Club deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
