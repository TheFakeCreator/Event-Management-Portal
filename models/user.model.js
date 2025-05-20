import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    name: {
      type: String,
      required: true,
      trim: true, // Removes extra spaces
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
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
      required: false,
    },
    gender: {
      type: String,
      enum: ["male", "Female", "other"],
      default: "other",
    },
    avatar: {
      type: String, // Store image URL (Cloudinary, Firebase, etc.)
      default: "/images/male.jpg",
    },
    bio: {
      type: String,
      maxlength: 250, // Limit bio length
    },
    phone: {
      type: String,
    },
    socials: {
      linkedin: { type: String },
      github: { type: String },
      behance: { type: String },
    },
    clubs: [
      {
        id: {
          type: Schema.Types.ObjectId,
          ref: "Club",
        },
        designation: {
          type: String,
        },
      },
    ],
    moderatorClubs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Club", // Assuming a separate Club model
      },
    ],
    createdEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    participatedEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "user", "member", "moderator"],
      default: "user",
    },
    roleRequest: {
      type: String,
      enum: ["admin", "user", "moderator", "member", null],
      default: null,
    },
    lastLogin: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    expireToken: {
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
