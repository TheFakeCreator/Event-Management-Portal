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
    about: {
      type: String,
    },
    image: {
      type: String,
      required: false, // Made optional to allow deleting display image
    },
    banner: {
      type: String,
    },
    domains: [
      {
        type: String,
      },
    ],
    sponsors: [
      {
        name: {
          type: String,
          required: true,
        },
        logo: {
          type: String,
        },
        description: {
          type: String,
        },
        website: {
          type: String,
        },
      },
    ],
    recruitments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Recruitment",
      },
    ],
    social: {
      email: {
        type: String,
      },
      instagram: {
        type: String,
      },
      facebook: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      discord: {
        type: String,
      },
    },
    gallery: [
      {
        url: {
          type: String,
        },
        caption: {
          type: String,
        },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    currentOc: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pastOc: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    currentMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pastMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    moderators: [
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
