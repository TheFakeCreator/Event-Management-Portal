import Recruitment from "../models/recruitment.model.js";
import Registration from "../models/registration.model.js";

export const getRecruitments = async (req, res) => {
  const user = req.user;
  try {
    // Fetch all recruitments and populate club
    const recruitments = await Recruitment.find({})
      .populate("club")
      .sort({ deadline: 1 });
    // For each recruitment, count total applicants
    const recruitmentsWithCounts = await Promise.all(
      recruitments.map(async (rec) => {
        const totalApplicants = await Registration.countDocuments({
          recruitment: rec._id,
        });
        return { ...rec.toObject(), totalApplicants };
      })
    );
    // Filter out expired recruitments (deadline + 1 day < now)
    const now = new Date();
    const recruitmentsFiltered = recruitmentsWithCounts.filter((rec) => {
      const deadline = new Date(rec.deadline);
      // Add 1 day (in ms)
      return now <= new Date(deadline.getTime() + 24 * 60 * 60 * 1000);
    });
    res.render("recruitment", {
      title: "Recruitments",
      user,
      isAuthenticated: req.isAuthenticated,
      recruitments: recruitmentsFiltered,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("recruitment", {
      title: "Recruitments",
      user,
      isAuthenticated: req.isAuthenticated,
      recruitments: [],
      error: "Failed to load recruitments.",
    });
  }
};

export const getNewRecruitments = async (req, res) => {
  try {
    const user = req.user;
    const clubId = req.query.club;
    res.render("createRecruitment", {
      title: "Create Recruitment",
      user,
      isAuthenticated: req.isAuthenticated,
      clubId,
    });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
};

export const getApplyRecruitment = async (req, res) => {
  try {
    const recruitment = await Recruitment.findById(req.params.id).populate(
      "club"
    );
    if (!recruitment) return res.status(404).send("Recruitment not found");
    res.render("applyRecruitment", {
      title: "Apply for Recruitment",
      recruitment,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const postNewRecruitment = async (req, res) => {
  const user = req.user;
  const { title, description, deadline, clubId } = req.body;
  try {
    // Import Recruitment model here to avoid circular dependencies
    const Recruitment = (await import("../models/recruitment.model.js"))
      .default;
    await Recruitment.create({
      title,
      description,
      deadline,
      club: clubId,
      isActive: true,
    });
    res.redirect(`/club/${clubId}/about`);
  } catch (err) {
    console.error(err);
    res.status(500).render("createRecruitment", {
      title: "Create Recruitment",
      user,
      isAuthenticated: req.isAuthenticated,
      clubId,
      error: "Failed to create recruitment. Please try again.",
    });
  }
};

export const postApplyRecruitment = async (req, res) => {
  try {
    const { name, email } = req.body;
    const recruitmentId = req.params.id;
    const Recruitment = (await import("../models/recruitment.model.js"))
      .default;
    const Registration = (await import("../models/registration.model.js"))
      .default;
    const recruitment = await Recruitment.findById(recruitmentId).populate(
      "club"
    );
    if (!recruitment) {
      return res.status(404).render("applyRecruitment", {
        title: "Apply for Recruitment",
        recruitment: {},
        user: req.user,
        isAuthenticated: req.isAuthenticated,
        error: "Recruitment not found.",
      });
    }
    // Check deadline
    const now = new Date();
    if (now > recruitment.deadline) {
      return res.render("applyRecruitment", {
        title: "Apply for Recruitment",
        recruitment,
        user: req.user,
        isAuthenticated: req.isAuthenticated,
        error: "The deadline for this recruitment has passed.",
      });
    }
    // Check if user already applied for this recruitment
    const alreadyApplied = await Registration.findOne({
      recruitment: recruitmentId,
      email,
    });
    if (alreadyApplied) {
      return res.render("applyRecruitment", {
        title: "Apply for Recruitment",
        recruitment,
        user: req.user,
        isAuthenticated: req.isAuthenticated,
        error: "You have already applied for this recruitment.",
      });
    }
    // Save registration
    await Registration.create({
      recruitment: recruitmentId,
      name,
      email,
    });
    // Get updated total applicants
    const totalApplicants = await Registration.countDocuments({
      recruitment: recruitmentId,
    });
    res.render("applyRecruitment", {
      title: "Apply for Recruitment",
      recruitment,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
      success: "Application submitted successfully!",
      totalApplicants,
    });
  } catch (err) {
    res.status(500).render("applyRecruitment", {
      title: "Apply for Recruitment",
      recruitment: {},
      user: req.user,
      isAuthenticated: req.isAuthenticated,
      error: "Failed to submit application.",
    });
  }
};
