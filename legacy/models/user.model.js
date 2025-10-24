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
    // Password Security Fields
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockUntil: {
      type: Date,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    passwordHistory: [
      {
        hash: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

// Virtual field to check if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.accountLockUntil && this.accountLockUntil > Date.now());
});

// Method to increment failed login attempts
userSchema.methods.incFailedAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockUntil && this.accountLockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        accountLockUntil: 1,
      },
      $set: {
        failedLoginAttempts: 1,
      },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // If we've reached max attempts and it's not locked already, lock the account
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      accountLockUntil: Date.now() + 2 * 60 * 60 * 1000, // Lock for 2 hours
    };
  }

  return this.updateOne(updates);
};

// Method to reset failed login attempts
userSchema.methods.resetFailedAttempts = function () {
  return this.updateOne({
    $unset: {
      failedLoginAttempts: 1,
      accountLockUntil: 1,
    },
  });
};

// Method to add password to history
userSchema.methods.addPasswordToHistory = function (hashedPassword) {
  // Keep only last 5 passwords
  const history = this.passwordHistory || [];
  history.unshift({ hash: hashedPassword });

  // Keep only the last 5 passwords
  if (history.length > 5) {
    history.splice(5);
  }

  this.passwordHistory = history;
  this.lastPasswordChange = Date.now();
};

const User = mongoose.model("User", userSchema);

export default User;
