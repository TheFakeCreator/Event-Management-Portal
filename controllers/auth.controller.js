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
