// middleware/moderatorMiddleware.js
import Club from "../models/club.model.js";

/**
 * Middleware to allow access only to moderators of a specific club (or admins).
 * Usage: Pass the club id as req.params.id or req.query.club or req.body.club or req.body.clubId
 */
export const isClubModerator = async (req, res, next) => {
  try {
    const user = req.user;

    // Not logged in
    if (!user) {
      return res.status(401).render("unauthorized", {
        title: "Unauthorized",
        message: "You must be logged in.",
        user: null,
        isAuthenticated: false,
      });
    }

    // Admins always have access
    if (user.role === "admin") return next();

    // Get club ID from multiple sources (body, query, params)
    const clubId =
      req.params.id ||
      req.query.club ||
      req.body.clubId || // recommend using this for clarity
      (req.body.club && req.body.club._id); // fallback if full club object is sent

    if (!clubId) {
      return res.status(400).render("unauthorized", {
        title: "Unauthorized",
        message: "Club ID is required.",
        user,
        isAuthenticated: req.isAuthenticated,
      });
    }

    // Check if user has moderatorClubs (already stored in User document)
    if (
      user.moderatorClubs &&
      user.moderatorClubs.some(
        (id) => id.toString() === clubId.toString()
      )
    ) {
      req.isClubMod = true;
      return next();
    }

    // If not in user object, double-check from the Club document
    const club = await Club.findById(clubId);
    if (
      club &&
      club.moderators &&
      club.moderators.some(
        (modId) => modId.toString() === user._id.toString()
      )
    ) {
      req.isClubMod = true;
      return next();
    }

    // Access denied
    return res.status(403).render("unauthorized", {
      title: "Unauthorized",
      message: "Access denied. Moderator-only section.",
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    console.error("Moderator middleware error:", err);
    return res.status(500).render("unauthorized", {
      title: "Server Error",
      message: "Something went wrong. Please try again.",
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  }
};
