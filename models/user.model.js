import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // Removes extra spaces
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Ensures uniformity
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String, // Store image URL (Cloudinary, Firebase, etc.)
      default: "/images/default-avatar.png",
    },
    bio: {
      type: String,
      maxlength: 250, // Limit bio length
    },
    phone: {
      type: String,
      match: [/^\d{10}$/, "Please enter a valid phone number"], // Validates 10-digit numbers
    },
    socials: {
      linkedin: { type: String },
      github: { type: String },
      twitter: { type: String },
    },
    occupation: {
      type: String,
      default: "Student",
    },
    location: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    lastLogin: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false, // Soft delete feature
    },
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

const User = mongoose.model("User", userSchema);

export default User;
