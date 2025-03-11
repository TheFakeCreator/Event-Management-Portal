import mongoose from "mongoose";

const Schema = mongoose.Schema;

const clubSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    oc: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", 
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true } 
);

const Club = mongoose.model("Club", clubSchema);
export default Club;
