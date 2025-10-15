import mongoose, { Document, Schema } from 'mongoose';
import { type Announcement as IAnnouncement } from '@event-management/shared';

// Mongoose Document interface with ObjectId references
export interface IAnnouncementDocument extends Document {
  title: string;
  message: string;
  postedBy: mongoose.Types.ObjectId;
  club?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncementDocument>({
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  club: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
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

// Pre-save middleware to update the updatedAt field
announcementSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
announcementSchema.statics.findByClub = function (clubId: string) {
  return this.find({ club: clubId }).populate('postedBy', 'name email');
};

announcementSchema.statics.findByUser = function (userId: string) {
  return this.find({ postedBy: userId }).populate('club', 'name');
};

announcementSchema.statics.findRecent = function (limit: number = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('postedBy', 'name email')
    .populate('club', 'name');
};

// Instance methods
announcementSchema.methods.updateMessage = function (newMessage: string) {
  this.message = newMessage;
  return this.save();
};

announcementSchema.methods.updateTitle = function (newTitle: string) {
  this.title = newTitle;
  return this.save();
};

// Add indexes for better query performance
announcementSchema.index({ club: 1 });
announcementSchema.index({ postedBy: 1 });
announcementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model<IAnnouncementDocument>(
  'Announcement',
  announcementSchema
);

export default Announcement;
