// middlewares/errorHandler.js
export default function errorHandler(err, req, res, next) {
  console.error(err.stack || err);
  res.status(err.status || 500);
  res.render("error", {
    title: err.status ? `Error ${err.status}` : "Error",
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
    isAuthenticated: req.isAuthenticated || false,
    user: req.user || {}, // send empty object instead of null to avoid TypeError
  });
}
