import mongoose from "mongoose";

const Schema = mongoose.Schema;

const registrationSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
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
      //match: [
       // /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
       // "Please enter a valid email address",
      //],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      // match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
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
