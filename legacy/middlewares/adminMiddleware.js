export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(401)
      .render("unauthorized.ejs", {
        title: "Unauthorized",
        isAuthenticated: req.isAuthenticated,
        user: req.user,
      });
  }
  next();
};
