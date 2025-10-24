import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

announcementSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
