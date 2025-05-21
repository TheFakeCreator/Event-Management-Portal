import mongoose from "mongoose";

const recruitmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  applicationForm: {
    type: Array, // Array of field definitions (JSON)
    default: [],
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

// Virtual for isActive
recruitmentSchema.virtual("isActive").get(function () {
  return this.deadline > new Date();
});

recruitmentSchema.set("toObject", { virtuals: true });
recruitmentSchema.set("toJSON", { virtuals: true });

recruitmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Recruitment = mongoose.model("Recruitment", recruitmentSchema);
export default Recruitment;
