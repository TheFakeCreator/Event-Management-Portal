import express from "express";
import {
  isAuthenticated,
  isAuthenticatedLineant,
} from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  createClub,
  getAddClub,
  getClubs,
  getClubTab,
  getEditClub,
  postEditClub,
  editAboutClub,
} from "../controllers/club.controller.js";
import { isClubModerator } from "../middlewares/moderatorMiddleware.js";
import upload from "../middlewares/upload.js";
import cloudinary from "../configs/cloudinary.js";

const router = express.Router();

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== "string") {
      return null;
    }

    // Handle different Cloudinary URL formats
    // https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/folder/filename.jpg
    // https://res.cloudinary.com/your-cloud-name/image/upload/folder/filename.jpg
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
router.get("/", isAuthenticatedLineant, getClubs);
router.get("/add", isAuthenticated, isAdmin, getAddClub);
router.get("/:id/edit", isAuthenticated, isClubModerator, getEditClub);
router.get("/:id/:subPage", isAuthenticatedLineant, getClubTab);

// POST Routes
router.post("/add", isAuthenticated, isAdmin, createClub);
router.post("/:id/edit", isAuthenticated, isClubModerator, postEditClub);
router.post("/:id/edit-about", isAuthenticated, isClubModerator, editAboutClub);

// POST: Upload image to club gallery
router.post(
  "/:id/gallery/upload",
  isAuthenticated,
  isClubModerator,
  upload.single("galleryImage"),
  async (req, res, next) => {
    try {
      const clubId = req.params.id;
      const Club = (await import("../models/club.model.js")).default;
      const club = await Club.findById(clubId);
      if (!club) {
        req.flash("error_msg", "Club not found.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      if (!req.file) {
        req.flash("error_msg", "No image uploaded.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      // Add to gallery
      club.gallery.unshift({
        url: req.file.path,
        caption: req.body.caption,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      });
      await club.save();
      req.flash("success_msg", "Image uploaded to gallery!");
      res.redirect("/club/" + clubId + "/gallery");
    } catch (err) {
      next(err);
    }
  }
);

// POST: Change club display image
router.post(
  "/:id/image/upload",
  isAuthenticated,
  isClubModerator,
  upload.single("clubImage"),
  async (req, res, next) => {
    try {
      const clubId = req.params.id;
      const Club = (await import("../models/club.model.js")).default;
      const club = await Club.findById(clubId);
      if (!club) {
        req.flash("error_msg", "Club not found.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      if (!req.file) {
        req.flash("error_msg", "No image uploaded.");
        return res.redirect("/club/" + clubId + "/gallery");
      }
      // Update club image
      club.image = req.file.path;
      await club.save();
      req.flash("success_msg", "Club display image updated!");
      res.redirect("/club/" + clubId + "/gallery");
    } catch (err) {
      next(err);
    }
  }
);

// POST: Delete image from club gallery
router.post(
  "/:id/gallery/:imageId/delete",
  isAuthenticated,
  isClubModerator,
  async (req, res, next) => {
    try {
      const clubId = req.params.id;
      const imageId = req.params.imageId;
      const Club = (await import("../models/club.model.js")).default;
      const club = await Club.findById(clubId);

      if (!club) {
        req.flash("error_msg", "Club not found.");
        return res.redirect("/club/" + clubId + "/gallery");
      }

      // Find the image to be deleted
      const imageToDelete = club.gallery.find(
        (img) => img._id.toString() === imageId
      );
      if (!imageToDelete) {
        req.flash("error_msg", "Image not found in gallery.");
        return res.redirect("/club/" + clubId + "/gallery");
      }

      // Try to delete from Cloudinary first
      if (imageToDelete.url) {
        const publicId = extractPublicId(imageToDelete.url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log(
              `Successfully deleted image from Cloudinary: ${publicId}`
            );
          } catch (cloudinaryError) {
            console.error("Error deleting from Cloudinary:", cloudinaryError);
            // Continue with database deletion even if Cloudinary deletion fails
          }
        }
      }

      // Remove image from gallery array
      const initialLength = club.gallery.length;
      club.gallery = club.gallery.filter(
        (img) => img._id.toString() !== imageId
      );

      if (club.gallery.length === initialLength) {
        req.flash("error_msg", "Image not found in gallery.");
        return res.redirect("/club/" + clubId + "/gallery");
      }

      await club.save();
      req.flash("success_msg", "Image deleted from gallery.");
      res.redirect("/club/" + clubId + "/gallery");
    } catch (err) {
      next(err);
    }
  }
);

// POST: Delete club display image
router.post(
  "/:id/image/delete",
  isAuthenticated,
  isClubModerator,
  async (req, res, next) => {
    try {
      const clubId = req.params.id;
      const Club = (await import("../models/club.model.js")).default;
      const club = await Club.findById(clubId);

      if (!club) {
        req.flash("error_msg", "Club not found.");
        return res.redirect("/club/" + clubId + "/gallery");
      }

      if (!club.image) {
        req.flash("error_msg", "No display image to delete.");
        return res.redirect("/club/" + clubId + "/gallery");
      }

      // Try to delete from Cloudinary first
      const publicId = extractPublicId(club.image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(
            `Successfully deleted club display image from Cloudinary: ${publicId}`
          );
        } catch (cloudinaryError) {
          console.error(
            "Error deleting club display image from Cloudinary:",
            cloudinaryError
          );
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }
      club.image = undefined;
      await club.save();
      req.flash("success_msg", "Club display image deleted.");
      res.redirect("/club/" + clubId + "/gallery");
    } catch (err) {
      next(err);
    }
  }
);

// Test route for moderator middleware
router.get("/:id/mod-section", isAuthenticated, isClubModerator, (req, res) => {
  res.send(
    "You are a moderator (or admin) for this club and can access this section."
  );
});

// Route: View all recruitment responses for a club (admin/moderator only)
router.get(
  "/:id/recruitments/responses",
  isAuthenticatedLineant,
  async (req, res) => {
    const user = req.user;
    const clubId = req.params.id;
    const Club = (await import("../models/club.model.js")).default;
    const Recruitment = (await import("../models/recruitment.model.js"))
      .default;
    const Registration = (await import("../models/registration.model.js"))
      .default;

    // Check permissions
    const club = await Club.findById(clubId);
    if (!club)
      return res.status(404).render("404", {
        title: "404",
        user,
        isAuthenticated: req.isAuthenticated,
      });
    const isMod =
      user &&
      (user.role === "admin" ||
        (club.moderators &&
          club.moderators
            .map((m) => m.toString())
            .includes(user._id.toString())));
    if (!isMod)
      return res.status(403).render("unauthorized", {
        title: "Unauthorized",
        user,
        isAuthenticated: req.isAuthenticated,
      });

    // Get all recruitments for this club
    const recruitments = await Recruitment.find({ club: clubId });
    const recruitmentIds = recruitments.map((r) => r._id);
    // Get all registrations for these recruitments
    const responses = await Registration.find({
      recruitment: { $in: recruitmentIds },
    }).lean();
    // Optionally, populate recruitment info and normalize answers
    const responsesWithRecruitment = await Promise.all(
      responses.map(async (resp) => {
        const rec = recruitments.find(
          (r) => r._id.toString() === resp.recruitment.toString()
        );
        // Normalize answers: support both 'answers' and 'customFields' keys
        let answers = resp.answers || resp.customFields || null;
        return {
          ...resp,
          recruitmentTitle: rec ? rec.title : "Recruitment",
          recruitmentId: rec ? rec._id : null,
          answers,
        };
      })
    );

    res.render("recruitmentResponses", {
      title: "Recruitment Responses",
      user,
      isAuthenticated: req.isAuthenticated,
      club,
      responses: responsesWithRecruitment,
    });
  }
);

export default router;
