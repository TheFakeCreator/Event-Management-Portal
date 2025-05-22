import Club from "../models/club.model.js";

export const getClubs = async (req, res, next) => {
  try {
    const user = req.user;
    const clubs = await Club.find();
    res.render("clubs", {
      title: "Clubs List",
      clubs,
      user,
      isAuthenticated: req.isAuthenticated,
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

    res.render(view, {
      title: club.name,
      club: { ...club.toObject(), activeRecruitments, pastRecruitments },
      user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    next(err);
  }
};

export const createClub = async (req, res, next) => {
  try {
    const { name, description, image, oc } = req.body;
    if (!name || !description || !image) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const newClub = await Club.create({
      name,
      description,
      image,
      // oc,
    });
    res.status(201).json(newClub);
  } catch (err) {
    next(err);
  }
};
