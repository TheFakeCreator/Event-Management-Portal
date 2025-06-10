import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../configs/nodemailer.js";
import crypto from "crypto";
import {
  generateAccessToken,
  generateVerificationToken,
  verifyToken,
  blacklistToken,
  getSecureCookieOptions,
  getClearCookieOptions,
} from "../utils/jwtManager.js";
import {
  logSecurityEvent,
  SECURITY_EVENTS,
  trackFailedLogin,
  clearFailedAttempts,
} from "../utils/securityLogger.js";

export const getLoginUser = (req, res, next) => {
  try {
    if (req.isAuthenticated) {
      return res.redirect(`/user/${req.user.username}`);
    }

    // Get the redirect URL from query parameters
    const redirectUrl = req.query.redirect || "";

    res.render("login", {
      success: req.flash("success"),
      error: req.flash("error"),
      redirectUrl: redirectUrl, // Pass redirect URL to the login form
    });
  } catch (err) {
    next(err);
  }
};

export const getRegisterUser = (req, res, next) => {
  try {
    if (req.isAuthenticated) {
      return res.redirect(`/user/${req.user.username}`);
    }
    res.render("signup", {
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

export const getForgotPass = (req, res, next) => {
  try {
    if (req.isAuthenticated) {
      return res.redirect(`/user/${req.user.username}`);
    }
    res.render("forgot-password", {
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

export const getResetPass = (req, res, next) => {
  try {
    if (req.isAuthenticated) {
      return res.redirect(`/user/${req.user.username}`);
    }
    res.render("reset-password", {
      token: req.params.token,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/auth/signup");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "User already exists.");
      return res.redirect("/auth/signup");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user but don't activate it yet
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      isVerified: false, // User is not verified yet
    }); // Generate a verification token with enhanced security
    const token = generateVerificationToken(newUser);

    // Create a verification link
    const verificationUrl = `https://event-management-portal.onrender.com/auth/verify/${token}`;

    // Send the verification email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your Email",
      html: `
        <h4>Hello ${name},</h4>
        <p>Thank you for registering. Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" target="_blank">Verify Email</a>
      `,
    });
    req.flash(
      "success",
      "Signup successful! Please check your email to verify your account."
    );

    // Log security event
    logSecurityEvent(
      SECURITY_EVENTS.ACCOUNT_CREATED,
      {
        email,
        username,
        userId: newUser._id,
      },
      req
    );

    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password, redirectUrl } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Log failed login attempt
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILED,
        {
          email,
          reason: "User not found",
        },
        req
      );

      trackFailedLogin(req.ip);

      req.flash("error", "Invalid credentials.");
      const redirect = redirectUrl
        ? `?redirect=${encodeURIComponent(redirectUrl)}`
        : "";
      return res.redirect(`/auth/login${redirect}`);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILED,
        {
          email,
          userId: user._id,
          reason: "Invalid password",
        },
        req
      );

      trackFailedLogin(req.ip);

      req.flash("error", "Invalid credentials.");
      const redirect = redirectUrl
        ? `?redirect=${encodeURIComponent(redirectUrl)}`
        : "";
      return res.redirect(`/auth/login${redirect}`);
    }

    if (!user.isVerified) {
      // Log failed login attempt
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILED,
        {
          email,
          userId: user._id,
          reason: "Email not verified",
        },
        req
      );

      req.flash("error", "Email not verified.");
      const redirect = redirectUrl
        ? `?redirect=${encodeURIComponent(redirectUrl)}`
        : "";
      return res.redirect(`/auth/login${redirect}`);
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(req.ip);

    // Generate JWT token with enhanced security
    const token = generateAccessToken(user);

    // Set secure cookie with enhanced security options
    res.cookie("token", token, getSecureCookieOptions());

    // Log successful login
    logSecurityEvent(
      SECURITY_EVENTS.LOGIN_SUCCESS,
      {
        email,
        userId: user._id,
        username: user.username,
      },
      req
    );

    // Redirect to the previous page or default to user profile
    if (redirectUrl && redirectUrl.trim() !== "") {
      // Ensure the redirect URL is safe (doesn't redirect to external sites)
      if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
        return res.redirect(redirectUrl);
      }
    }

    // Default redirect to user profile
    res.redirect(`/user/${user.username}`);
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    // Get the token to blacklist it
    const token = req.cookies.token;
    if (token) {
      blacklistToken(token);
    }

    // Log logout event
    if (req.user) {
      logSecurityEvent(
        SECURITY_EVENTS.LOGOUT,
        {
          userId: req.user._id,
          username: req.user.username,
        },
        req
      );
    }
    // Clear the token cookie with same options as when it was set
    res.clearCookie("token", getClearCookieOptions());

    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Verify the token with enhanced validation
    const decoded = verifyToken(token, "verification");

    const user = await User.findById(decoded.id);

    if (!user) {
      req.flash("error", "Invalid token or user not found.");
      return res.redirect("/auth/login");
    }

    // Check if user is already verified
    if (user.isVerified) {
      req.flash("info", "User already verified.");
      return res.redirect("/auth/login");
    }

    // Verify the user
    user.isVerified = true;
    await user.save();

    req.flash("success", "Email Verified Successfully! You can now login.");
    res.redirect("/auth/login");
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      req.flash(
        "error",
        "Verification link has expired. Please request a new one."
      );
    } else if (error.name === "JsonWebTokenError") {
      req.flash("error", "Invalid verification link.");
    } else {
      req.flash("error", "Verification failed. Please try again.");
    }
    res.redirect("/auth/login");
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Log password reset attempt for non-existent user
      logSecurityEvent(
        SECURITY_EVENTS.PASSWORD_RESET_REQUEST,
        {
          email,
          success: false,
          reason: "User not found",
        },
        req
      );

      req.flash("error", "User not found.");
      return res.redirect("/auth/forgot-password");
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.expireToken = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    const resetUrl = `https://event-management-portal.onrender.com/auth/reset-password/${token}`;
    await transporter.sendMail({
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click the link below to reset your password:</p>
               <a href="${resetUrl}">Reset Password</a>`,
    });

    // Log successful password reset request
    logSecurityEvent(
      SECURITY_EVENTS.PASSWORD_RESET_REQUEST,
      {
        email,
        userId: user._id,
        success: true,
      },
      req
    );

    req.flash("success", "Reset password email sent.");
    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { token } = req.params;

    if (newPassword !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    const user = await User.findOne({ resetToken: token });

    if (!user) {
      req.flash("error", "User not found or token invalid.");
      return res.redirect("/auth/forgot-password");
    }

    if (user.expireToken < Date.now()) {
      req.flash("error", "Token has expired.");
      return res.redirect("/auth/forgot-password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.expireToken = undefined;
    await user.save();

    // Log successful password change
    logSecurityEvent(
      SECURITY_EVENTS.PASSWORD_CHANGED,
      {
        userId: user._id,
        email: user.email,
        method: "reset_token",
      },
      req
    );

    req.flash("success", "Password reset successful. You can now login.");
    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};
