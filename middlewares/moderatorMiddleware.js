// middleware/moderatorMiddleware.js
import User from "../models/user.model.js";
import Club from "../models/club.model.js";

/**
 * Middleware to allow access only to moderators of a specific club (or admins).
 * Usage: Pass the club id as req.params.id or req.query.club or req.body.club
 */
export const isClubModerator = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .render("unauthorized", { message: "You must be logged in." });
    }
    if (user.role === "admin") return next();

    // Get club id from params, query, or body
    const clubId = req.params.id || req.query.club || req.body.club._id;
    if (!clubId) {
      return res
        .status(400)
        .render("unauthorized", { message: "Club ID is required." });
    }

    // Check if user is a moderator for this club
    // Option 1: If user.moderatorClubs is populated
    if (
      user.moderatorClubs &&
      user.moderatorClubs.some((id) => id.toString() === clubId.toString())
    ) {
      req.isClubMod = true; // Set a flag to indicate the user is a moderator
      return next();
    }

    // Option 2: If club has a moderators array
    const club = await Club.findById(clubId);
    if (
      club &&
      club.moderators &&
      club.moderators.some((id) => id.toString() === user._id.toString())
    ) {
      return next();
    }

    return res.status(403).render("unauthorized", {
      message: "Access denied. Moderator only section.",
    });
  } catch (err) {
    return res.status(500).render("unauthorized", { message: "Server error." });
  }
};
