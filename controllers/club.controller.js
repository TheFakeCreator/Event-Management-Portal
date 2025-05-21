import Club from "../models/club.model.js";

export const getClubs = async (req, res) => {
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
    console.error(err);
    res.status(500).send("Error fetching clubs");
  }
};

export const getAddClub = (req, res) => {
  const user = req.user;
  res.render("add-club", {
    title: "Add Club",
    isAuthenticated: req.isAuthenticated,
    user,
  });
};

const clubSubPages = {
  about: "clubDetailsAbout",
  recruitments: "clubDetailsRecruitments",
  gallery: "clubDetailsGallery",
  socials: "clubDetailsSocials",
  events: "clubDetailsEvents",
  members: "clubDetailsMembers",
};

export const getClubTab = async (req, res) => {
  try {
    const user = req.user;
    const { id, subPage } = req.params;

    const view = clubSubPages[subPage];
    if (!view) {
      return res.status(404).render("404", {
        message: "Club not found",
        title: "404 Page",
        user,
        isAuthenticated: req.isAuthenticated,
      });
    }

    // Populate recruitments
    const club = await Club.findById(id).populate("recruitments");
    if (!club) {
      return res.status(404).render("404", {
        message: "Club not found",
        title: "404 Page",
        user,
        isAuthenticated: req.isAuthenticated,
      });
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
    console.error(err);
    res.status(500).send("Error fetching club details");
  }
};

export const createClub = async (req, res) => {
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
};
