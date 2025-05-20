import mongoose from "mongoose";

const Schema = mongoose.Schema;

const registrationSchema = new Schema(
  {
    recruitment: {
      type: Schema.Types.ObjectId,
      ref: "Recruitment",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
