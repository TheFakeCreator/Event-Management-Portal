import User from "../models/user.model.js";

export const requestRole = async (req, res) => {
  try {
    const { requestedRole } = req.body;
    const user = req.user;
    const newUser = await User.findByIdAndUpdate(
      user._id,
      { roleRequest: requestedRole },
      { new: true, runValidators: true }
    );
    if (!newUser) {
      req.flash("error", "User not found");
      return res.redirect(`/user/${user.username}`);
    }
    req.flash("success", "Your role request has been submitted!");
    res.redirect(`/user/${user.username}`);
  } catch (error) {
    console.error("Error requesting role:", error);
    req.flash("error", "An error occurred while requesting your role.");
    res.redirect("/dashboard");
  }
};
