import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../configs/nodemailer.js";

export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
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
    const verificationUrl = `http://localhost:3000/auth/verify/${token}`;

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

    res.status(200).json({
      message:
        "Signup successful! Please check your email to verify your account.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    if (!user.isVerified) {
      return res.status(401).json({ message: "Email not verified." });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 1000, // 1 day
    });
    res.status(200).redirect(`/${user.username}`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyUser = async (req, res) => {
  const { token } = req.params;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid token or user not found." });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified." });
    }

    // Verify the user
    user.isVerified = true;
    await user.save();

    res.status(200).send(`
      <h4>Email Verified Successfully!</h4>
      <p>You can now <a href="/auth/login">login</a> to your account.</p>
    `);
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.expireToken = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    const resetUrl = `http://localhost:3000/auth/reset-password/${token}`;
    await transporter.sendMail({
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click the link below to reset your password:</p>
               <a href="${resetLink}">Reset Password</a>`,
    });
    res.status(200).json({ message: "Reset password email sent." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    const user = await User.findOne({
      resetToken: token,
      expireToken: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid token or expired token." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.expireToken = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
