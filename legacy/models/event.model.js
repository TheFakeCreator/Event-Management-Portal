import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  Type: {
    type: String,
    enum: [
      "Workshops",
      "Talks",
      "Workshops & Talks",
      "Meetups",
      "Networking",
      "Fun",
      "Tech",
      "Other",
    ],
    required: true,
    default: "Other",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  club: {
    type: Schema.Types.ObjectId,
    ref: "Club",
  },
  collaborators: [
    {
      type: Schema.Types.ObjectId,
      ref: "Club",
    },
  ],
  registeredUsers: {
    type: Number,
    default: 0,
  },
  // registrations: [
  //   {
  //     type: Schema.Types.ObjectId,
  //     ref: "EventRegistration",
  //   },
  // ],
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
  winners: [
    {
      position: {
        type: String, // "1st Place", "2nd Place", "Best Team", etc.
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String, // Achievement description
      },
      prize: {
        type: String, // Prize details
      },
    },
  ],
  eventLeads: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  preEventNotes: {
    type: String, // plan for handling the event
  },
  postEventNotes: {
    type: String, // feedback and suggestions for the upcoming handlers
  },
  reports: [
    {
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      reason: {
        type: String,
        enum: [
          "inappropriate_content",
          "misleading_information",
          "unauthorized_collaboration",
          "spam",
          "other",
        ],
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      reportedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "resolved", "dismissed"],
        default: "pending",
      },
    },
  ],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
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

const Event = mongoose.model("Event", eventSchema);

export default Event;
