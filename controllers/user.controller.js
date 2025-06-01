import User from "../models/user.model.js";
import Club from "../models/club.model.js";
import cloudinary from "../configs/cloudinary.js";

// Helper function to extract public_id from Cloudinary URL
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

export const getUser = (req, res, next) => {
  try {
    res.render("dashboard", {
      user: req.user,
      title: "Dashboard",
      isAuthenticated: req.isAuthenticated,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    return next(err);
  }
};

export const getUserEdit = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }
    res.render("edit-profile", {
      title: "Edit Profile",
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    next(err);
  }
};

export const getRequestRole = async (req, res, next) => {
  try {
    const clubs = await Club.find({}, "_id name");
    res.render("request-role", {
      title: "Request Role",
      user: req.user,
      isAuthenticated: req.isAuthenticated,
      clubs,
    });
  } catch (err) {
    next(err);
  }
};

export const postUserEdit = async (req, res, next) => {
  try {
    console.log("Edit Profile req.body:", req.body);
    const {
      name,
      username,
      phone,
      bio,
      occupation,
      location: userLocation,
      gender,
      linkedin,
      github,
      behance,
    } = req.body;
    const socials = { linkedin, github, behance };
    const userId = req.user._id;
    let updateData = {
      name,
      username,
      phone,
      bio,
      occupation,
      location: userLocation,
      gender,
      socials,
    };
    if (req.file && req.file.path) {
      // Remove the old avatar if it exists
      const user = await User.findById(userId);
      if (user && user.avatar) {
        const publicId = extractPublicId(user.avatar);
        if (publicId) {
          await cloudinary.v2.uploader.destroy(publicId);
        }
      }

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
    next(error);
  }
};

export const requestRole = async (req, res, next) => {
  try {
    const { requestedRole, clubId } = req.body;
    const user = req.user;
    if (clubId) {
      console.log(`User requested role ${requestedRole} for club ${clubId}`);
    }
    const update = { roleRequest: requestedRole };
    const newUser = await User.findByIdAndUpdate(user._id, update, {
      new: true,
      runValidators: true,
    });
    if (!newUser) {
      req.flash("error", "User not found");
      return res.redirect(`/user/${user.username}`);
    }
    req.flash("success", "Your role request has been submitted!");
    res.redirect(`/user/${user.username}`);
  } catch (error) {
    next(error);
  }
};
