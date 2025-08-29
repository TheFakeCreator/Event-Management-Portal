import mongoose from "mongoose";

const emailQueueSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  template: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    default: {},
  },
  status: {
    type: String,
    enum: ["pending", "processing", "sent", "failed"],
    default: "pending",
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
  nextRetry: {
    type: Date,
  },
  error: {
    type: String,
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high"],
    default: "normal",
  },
  batchId: {
    type: String, // For grouping related emails (e.g., club announcement)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  sentAt: {
    type: Date,
  },
  processedAt: {
    type: Date,
  },
});

// Index for performance
emailQueueSchema.index({ status: 1, nextRetry: 1, priority: -1 });
emailQueueSchema.index({ batchId: 1 });
emailQueueSchema.index({ createdAt: 1 });

const EmailQueue = mongoose.model("EmailQueue", emailQueueSchema);
export default EmailQueue;
