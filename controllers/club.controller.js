import Club from "../models/club.model.js";
import Event from "../models/event.model.js";
import { marked } from "marked";
export const getClubs = async (req, res, next) => {
  try {
    const user = req.user;
    const clubs = await Club.find();
    res.render("clubs", {
      title: "Clubs List",
      clubs,
      user,
      isAuthenticated: req.isAuthenticated,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

export const getAddClub = (req, res, next) => {
  try {
    const user = req.user;
    res.render("add-club", {
      title: "Add Club",
      isAuthenticated: req.isAuthenticated,
      user,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

const clubSubPages = {
  about: "clubDetailsAbout",
  recruitments: "clubDetailsRecruitments",
  gallery: "clubDetailsGallery",
  socials: "clubDetailsSocials",
  events: "clubDetailsEvents",
  members: "clubDetailsMembers",
  sponsors: "clubDetailsSponsors",
};

export const getClubTab = async (req, res, next) => {
  try {
    const user = req.user;
    const { id, subPage } = req.params;
    const view = clubSubPages[subPage];
    if (!view) {
      const error = new Error("Club not found");
      error.status = 404;
      return next(error);
    }
    // Populate recruitments
    const club = await Club.findById(id).populate("recruitments");
    if (!club) {
      const error = new Error("Club not found");
      error.status = 404;
      return next(error);
    }
    // Filter recruitments into active and past
    const activeRecruitments = club.recruitments.filter((r) => r.isActive);
    const pastRecruitments = club.recruitments.filter((r) => !r.isActive);
    // Markdown support for about/description
    const aboutSource = club.about || club.description || "";
    const aboutHtml = marked.parse(aboutSource);

    // --- EVENTS LOGIC ---
    let activeEvents = [];
    let pastEvents = [];
    if (subPage === "events") {
      const now = new Date();
      activeEvents = await Event.find({
        club: id,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).sort({ startDate: 1 });
      pastEvents = await Event.find({
        club: id,
        endDate: { $lt: now },
      }).sort({ endDate: -1 });
    }

    // Determine if user is moderator for this club
    let isClubMod = false;
    if (
      user &&
      (user.role === "admin" ||
        (club.moderators &&
          club.moderators
            .map((m) => m.toString())
            .includes(user._id.toString())))
    ) {
      isClubMod = true;
    }

    res.render(view, {
      title: club.name,
      club: {
        ...club.toObject(),
        activeRecruitments,
        pastRecruitments,
        activeEvents,
        pastEvents,
      },
      user,
      isAuthenticated: req.isAuthenticated,
      success: req.flash("success"),
      error: req.flash("error"),
      aboutHtml,
      isClubMod, // Pass to view
    });
  } catch (err) {
    next(err);
  }
};

export const createClub = async (req, res, next) => {
  try {
    const { name, description, image, oc } = req.body;
    if (!name || !description || !image) {
      req.flash("error", "All fields are required.");
      return res.redirect("/club/add");
    }
    const newClub = await Club.create({
      name,
      description,
      image,
      // oc,
    });
    req.flash("success", "Club created successfully!");
    res.redirect("/club");
  } catch (err) {
    next(err);
  }
};

export const getEditClub = async (req, res, next) => {
  try {
    const user = req.user;
    const club = await Club.findById(req.params.id);
    if (!club) {
      req.flash("error", "Club not found.");
      return res.redirect("/club");
    }
    // Only allow admin or moderator
    if (
      !(
        user.role === "admin" ||
        (club.moderators &&
          club.moderators
            .map((m) => m.toString())
            .includes(user._id.toString()))
      )
    ) {
      return res
        .status(403)
        .render("unauthorized", {
          title: "Unauthorized",
          user,
          isAuthenticated: req.isAuthenticated,
        });
    }
    res.render("editClub", {
      title: "Edit Club",
      club,
      user,
      isAuthenticated: req.isAuthenticated,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

export const postEditClub = async (req, res, next) => {
  try {
    const user = req.user;
    const club = await Club.findById(req.params.id);
    if (!club) {
      req.flash("error", "Club not found.");
      return res.redirect("/club");
    }
    // Only allow admin or moderator
    if (
      !(
        user.role === "admin" ||
        (club.moderators &&
          club.moderators
            .map((m) => m.toString())
            .includes(user._id.toString()))
      )
    ) {
      return res
        .status(403)
        .render("unauthorized", {
          title: "Unauthorized",
          user,
          isAuthenticated: req.isAuthenticated,
        });
    }
    // Update fields
    club.name = req.body.name;
    club.description = req.body.description;
    club.about = req.body.about;
    club.image = req.body.image;
    club.banner = req.body.banner;
    await club.save();
    req.flash("success", "Club details updated successfully!");
    res.redirect(`/club/${club._id}/about`);
  } catch (err) {
    next(err);
  }
};

export const editAboutClub = async (req, res) => {
  try {
    const user = req.user;
    const clubId = req.params.id;
    const { about } = req.body;

    const club = await Club.findById(clubId);
    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: "Club not found" });
    }

    // Check permission - only admin or club moderator can edit
    const isClubMod =
      user.role === "admin" ||
      (club.moderators &&
        club.moderators.map((m) => m.toString()).includes(user._id.toString()));

    if (!isClubMod) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Update the about field
    club.about = about;
    await club.save();

    // Return the updated content rendered as HTML for immediate preview
    const htmlContent = marked.parse(about || "");

    res.json({
      success: true,
      message: "About section updated successfully",
      htmlContent,
    });
  } catch (error) {
    console.error("Error updating club about:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getClubSponsors = async (req, res) => {
  try {
    const user = req.user;
    const clubId = req.params.id;
    const club = await Club.findById(clubId);

    if (!club) {
      req.flash("error", "Club not found");
      return res.redirect("/club");
    }

    res.render("clubDetailsSponsors", {
      title: "Club Sponsors",
      club,
      user,
      isAuthenticated: req.isAuthenticated,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    console.error("Error fetching club sponsors:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addClubSponsor = async (req, res) => {
  try {
    const { name, logo, description, website } = req.body;
    const clubId = req.params.id;
    const club = await Club.findById(clubId);

    if (!club) {
      req.flash("error", "Club not found");
      return res.redirect("/club");
    }

    // Check permission - only admin or club moderator can add sponsors
    const isClubMod =
      req.user.role === "admin" ||
      (club.moderators &&
        club.moderators.map((m) => m.toString()).includes(req.user._id.toString()));

    if (!isClubMod) {
      return res.status(403).render("unauthorized", {
        title: "Unauthorized",
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }

    club.sponsors.push({
      name,
      logo,
      description,
      website,
    });

    await club.save();
    req.flash("success", "Sponsor added successfully!");
    res.redirect(`/club/${clubId}/sponsors`);
  } catch (error) {
    console.error("Error adding club sponsor:", error);
    req.flash("error", "Failed to add sponsor");
    res.redirect(`/club/${req.params.id}/sponsors`);
  }
};

export const editClubSponsor = async (req, res) => {
  try {
    const { name, logo, description, website } = req.body;
    const { id: clubId, sponsorId } = req.params;
    const club = await Club.findById(clubId);

    if (!club) {
      req.flash("error", "Club not found");
      return res.redirect("/club");
    }

    // Check permission
    const isClubMod =
      req.user.role === "admin" ||
      (club.moderators &&
        club.moderators.map((m) => m.toString()).includes(req.user._id.toString()));

    if (!isClubMod) {
      return res.status(403).render("unauthorized", {
        title: "Unauthorized",
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }

    const sponsorIndex = club.sponsors.findIndex(
      (s) => s._id.toString() === sponsorId
    );

    if (sponsorIndex === -1) {
      req.flash("error", "Sponsor not found");
      return res.redirect(`/club/${clubId}/sponsors`);
    }

    club.sponsors[sponsorIndex] = {
      ...club.sponsors[sponsorIndex],
      name,
      logo,
      description,
      website,
    };

    await club.save();
    req.flash("success", "Sponsor updated successfully!");
    res.redirect(`/club/${clubId}/sponsors`);
  } catch (error) {
    console.error("Error updating club sponsor:", error);
    req.flash("error", "Failed to update sponsor");
    res.redirect(`/club/${req.params.id}/sponsors`);
  }
};

export const deleteClubSponsor = async (req, res) => {
  try {
    const { id: clubId, sponsorId } = req.params;
    const club = await Club.findById(clubId);

    if (!club) {
      req.flash("error", "Club not found");
      return res.redirect("/club");
    }

    // Check permission
    const isClubMod =
      req.user.role === "admin" ||
      (club.moderators &&
        club.moderators.map((m) => m.toString()).includes(req.user._id.toString()));

    if (!isClubMod) {
      return res.status(403).render("unauthorized", {
        title: "Unauthorized",
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }

    club.sponsors = club.sponsors.filter(
      (s) => s._id.toString() !== sponsorId
    );

    await club.save();
    req.flash("success", "Sponsor deleted successfully!");
    res.redirect(`/club/${clubId}/sponsors`);
  } catch (error) {
    console.error("Error deleting club sponsor:", error);
    req.flash("error", "Failed to delete sponsor");
    res.redirect(`/club/${req.params.id}/sponsors`);
  }
};
