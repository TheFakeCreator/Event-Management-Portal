import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../configs/nodemailer.js";
import crypto from "crypto";

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
    });

    // Generate a verification token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

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
      req.flash("error", "Invalid credentials.");
      const redirect = redirectUrl
        ? `?redirect=${encodeURIComponent(redirectUrl)}`
        : "";
      return res.redirect(`/auth/login${redirect}`);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid credentials.");
      const redirect = redirectUrl
        ? `?redirect=${encodeURIComponent(redirectUrl)}`
        : "";
      return res.redirect(`/auth/login${redirect}`);
    }
    if (!user.isVerified) {
      req.flash("error", "Email not verified.");
      const redirect = redirectUrl
        ? `?redirect=${encodeURIComponent(redirectUrl)}`
        : "";
      return res.redirect(`/auth/login${redirect}`);
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 1000, // 1 day
    });

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
    res.clearCookie("token");
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    req.flash("error", "Verification link is invalid or expired.");
    res.redirect("/auth/login");
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
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

    req.flash("success", "Password reset successful. You can now login.");
    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};
