import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      // Store the current URL as the redirect URL
      const redirectUrl = req.originalUrl;
      return res.redirect(
        `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      // Store the current URL as the redirect URL
      const redirectUrl = req.originalUrl;
      return res.redirect(
        `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
      );
    }

    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    // Store the current URL as the redirect URL
    const redirectUrl = req.originalUrl;
    res.redirect(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
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
