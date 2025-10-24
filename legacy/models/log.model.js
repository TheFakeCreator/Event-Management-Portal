import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model (Admin/Moderator who performed the action)
      required: true,
    },
    affectedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model (Admin/Moderator who performed the action)
    },
    action: {
      type: String,
      enum: ["CREATE", "EDIT", "DELETE"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["USER", "ROLE", "CLUB", "EVENT", "OTHER"], // What entity was affected
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId, // ID of the affected entity
      required: true,
    },
    details: {
      type: String, // Optional description of the action
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Log = mongoose.model("Log", logSchema);
export default Log;
