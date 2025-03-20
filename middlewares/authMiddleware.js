import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/auth/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.redirect("/auth/login"); // Handle case where user doesn't exist
    }

    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    res.redirect("/auth/login");
  }
};


export const isAuthenticatedLineant = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      req.isAuthenticated = false;
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error(error);
    res.redirect("/auth/login");
  }
};
