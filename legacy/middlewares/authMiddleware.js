import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { verifyToken, getClearCookieOptions } from "../utils/jwtManager.js";

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

    // Verify token with enhanced validation (backward compatible - no type check for existing tokens)
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      // Store the current URL as the redirect URL
      const redirectUrl = req.originalUrl;
      return res.redirect(
        `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
      );
    }

    // Verify user is still active/verified
    if (!user.isVerified) {
      const redirectUrl = req.originalUrl;
      return res.redirect(
        `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
      );
    }

    req.user = user;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error("Authentication Error:", error.name, error.message);

    // Clear invalid token
    res.clearCookie("token", getClearCookieOptions());

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

    // Verify token with enhanced validation (backward compatible - no type check for existing tokens)
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isVerified) {
      req.isAuthenticated = false;
      return next();
    }

    req.user = user;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error("Authentication Error:", error.name, error.message);

    // Clear invalid token
    res.clearCookie("token", getClearCookieOptions());

    req.isAuthenticated = false;
    next();
  }
};
