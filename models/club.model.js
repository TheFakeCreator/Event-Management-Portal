import mongoose from "mongoose";

const Schema = mongoose.Schema;

const clubSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    events: [
        {
            type: Schema.Types.ObjectId,
            ref: "Event"
        }
    ],
    oc: [
        {
            type: Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    createdby: {
        type: Date,
        default: Date.now,
      },
      updatedby: {
        type: Date,
        default: Date.now,
      },
});