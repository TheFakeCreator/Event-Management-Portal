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

export const postNewRecruitment = async (req, res) => {
  const user = req.user;
  const { title, description, deadline, clubId, applicationForm } = req.body;
  try {
    const Recruitment = (await import("../models/recruitment.model.js"))
      .default;
    const Club = (await import("../models/club.model.js")).default;
    // Parse applicationForm JSON if present
    let formFields = [];
    if (applicationForm) {
      try {
        formFields = JSON.parse(applicationForm);
      } catch (e) {
        formFields = [];
      }
    }
    // Create the recruitment
    const newRecruitment = await Recruitment.create({
      title,
      description,
      deadline,
      club: clubId,
      applicationForm: formFields,
    });
    // Push the recruitment's _id into the club's recruitments array
    await Club.findByIdAndUpdate(
      clubId,
      { $push: { recruitments: newRecruitment._id } },
      { new: true }
    );
    res.redirect(`/club/${clubId}/recruitments`);
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
    const recruitmentId = req.params.id;
    const Recruitment = (await import("../models/recruitment.model.js"))
      .default;
    const Registration = (await import("../models/registration.model.js"))
      .default;
    const recruitment = await Recruitment.findById(recruitmentId).populate(
      "club"
    );
    if (!recruitment) {
      return res.status(404).render("404", {
        message: "Recruitment not found",
        title: "404 Page",
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }
    // Check deadline
    const now = new Date();
    if (now > recruitment.deadline) {
      return res.render("recruitmentDetails", {
        title: recruitment.title,
        recruitment,
        user: req.user,
        isAuthenticated: req.isAuthenticated,
        error: "The deadline for this recruitment has passed.",
      });
    }
    // Build customFields object from recruitment.applicationForm
    let customFields = {};
    if (recruitment.applicationForm && recruitment.applicationForm.length > 0) {
      recruitment.applicationForm.forEach((field) => {
        const key = `custom_${field.label.replace(/\s+/g, "_").toLowerCase()}`;
        customFields[field.label] = req.body[key] || "";
      });
    }
    // Save registration (add customFields)
    await Registration.create({
      recruitment: recruitmentId,
      name: req.body.name,
      email: req.body.email,
      customFields,
    });
    // Get updated total applicants
    const totalApplicants = await Registration.countDocuments({
      recruitment: recruitmentId,
    });
    // Set flash message for success
    req.flash("success", "Application submitted successfully!");
    // Redirect to GET
    return res.redirect(`/recruitment/${recruitmentId}`);
  } catch (err) {
    // On error, redirect to GET with error message
    return res.redirect(
      `/recruitment/${req.params.id}?error=Failed to submit application.`
    );
  }
};

export const getRecruitmentDetails = async (req, res) => {
  try {
    const Recruitment = (await import("../models/recruitment.model.js"))
      .default;
    const recruitment = await Recruitment.findById(req.params.id).populate(
      "club"
    );
    if (!recruitment) {
      return res.status(404).render("404", {
        message: "Recruitment not found",
        title: "404 Page",
        user: req.user,
        isAuthenticated: req.isAuthenticated,
      });
    }
    // If redirected after POST, pass success/error/totalApplicants if present
    res.render("recruitmentDetails", {
      title: recruitment.title,
      recruitment,
      user: req.user,
      isAuthenticated: req.isAuthenticated,
      success: req.flash("success"),
      error: req.flash("error"),
      totalApplicants: req.query.totalApplicants,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching recruitment details");
  }
};
