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
