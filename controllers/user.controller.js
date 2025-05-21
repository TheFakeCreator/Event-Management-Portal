import User from "../models/user.model.js";

export const getUser = (req, res) => {
  try {
    res.render("dashboard", {
      user: req.user,
      title: "Dashboard",
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
};

export const getUserEdit = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("edit-profile", {
      title: "Edit Profile",
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    console.error("Error loading edit profile page:", err);
    res.status(500).send("Error loading page");
  }
};

export const getRequestRole = (req, res) => {
  try {
    res.render("request-role", {
      title: "Request Role",
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    console.error("Error loading request role page:", err);
    res.status(500).send("Error loading page");
  }
};

export const postUserEdit = async (req, res) => {
  try {
    console.log("Edit Profile req.body:", req.body);
    const {
      name,
      username,
      phone,
      bio,
      occupation,
      location,
      gender,
      linkedin,
      github,
      behance,
    } = req.body;
    const socials = { linkedin, github, behance };
    const userId = req.user._id;

    // Handle avatar upload if a file is present
    let updateData = {
      name,
      username,
      phone,
      bio,
      occupation,
      location,
      gender,
      socials,
    };
    if (req.file && req.file.path) {
      updateData.avatar = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      req.flash("error", "User not found");
      return res.redirect(`/user/${req.user.username}`);
    }

    req.flash("success", "Profile updated successfully!");
    res.redirect(`/user/${updatedUser.username}`);
  } catch (error) {
    console.error("Error updating profile:", error);
    req.flash("error", "Something went wrong!");
    res.status(500).json({ message: "Server error" });
  }
};

export const requestRole = async (req, res) => {
  try {
    const { requestedRole } = req.body;
    const user = req.user;
    const newUser = await User.findByIdAndUpdate(
      user._id,
      { roleRequest: requestedRole },
      { new: true, runValidators: true }
    );
    if (!newUser) {
      req.flash("error", "User not found");
      return res.redirect(`/user/${user.username}`);
    }
    req.flash("success", "Your role request has been submitted!");
    res.redirect(`/user/${user.username}`);
  } catch (error) {
    console.error("Error requesting role:", error);
    req.flash("error", "An error occurred while requesting your role.");
    res.redirect("/dashboard");
  }
};
