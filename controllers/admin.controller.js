import Club from "../models/club.model.js";
import User from "../models/user.model.js";
import Event from "../models/event.model.js";

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

// Assign Role to a User
export const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create a New Club
export const createClub = async (req, res) => {
  try {
    const { name, description } = req.body;
    const club = new Club({ name, description });
    await club.save();
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
    res.json({ message: "Club deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
