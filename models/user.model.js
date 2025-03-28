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
    avatar: {
      type: String, // Store image URL (Cloudinary, Firebase, etc.)
      default: "/images/default-avatar.png",
    },
    bio: {
      type: String,
      maxlength: 250, // Limit bio length
    },
    phone: {
      type: Number,
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
      enum: ["admin", "user", "member", "moderator"],
      default: "user",
    },
    roleRequest: {
      type: String,
      enum: ["admin", "user", null],
      default: null,
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
