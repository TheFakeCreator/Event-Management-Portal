import mongoose, { Document, Schema } from 'mongoose';
import { type EventRegistration as IEventRegistration } from '@event-management/shared';

// Mongoose Document interface with ObjectId references
export interface IEventRegistrationDocument extends Document {
  event: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  user?: mongoose.Types.ObjectId;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventRegistrationSchema = new Schema<IEventRegistrationDocument>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // allow guest registrations if needed
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Static methods
eventRegistrationSchema.statics.findByEvent = function (eventId: string) {
  return this.find({ event: eventId })
    .populate('user', 'name email')
    .populate('event', 'title startDate')
    .sort({ registeredAt: -1 });
};

eventRegistrationSchema.statics.findByUser = function (userId: string) {
  return this.find({ user: userId })
    .populate('event', 'title startDate location')
    .sort({ registeredAt: -1 });
};

eventRegistrationSchema.statics.findByEmail = function (email: string) {
  return this.find({ email })
    .populate('event', 'title startDate location')
    .sort({ registeredAt: -1 });
};

eventRegistrationSchema.statics.findGuestRegistrations = function () {
  return this.find({ user: { $exists: false } })
    .populate('event', 'title startDate location')
    .sort({ registeredAt: -1 });
};

eventRegistrationSchema.statics.findRecent = function (days: number = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.find({ registeredAt: { $gte: dateThreshold } })
    .populate('user', 'name email')
    .populate('event', 'title startDate')
    .sort({ registeredAt: -1 });
};

eventRegistrationSchema.statics.getStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
        guestCount: {
          $sum: {
            $cond: [{ $exists: ['$user', false] }, 1, 0],
          },
        },
        userCount: {
          $sum: {
            $cond: [{ $exists: ['$user', true] }, 1, 0],
          },
        },
        recent: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$registeredAt',
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        totalGuest: { $sum: '$guestCount' },
        totalUser: { $sum: '$userCount' },
        totalRecent: { $sum: '$recent' },
        byEvent: {
          $push: {
            eventId: '$_id',
            count: '$count',
          },
        },
      },
    },
  ]);
};

// Instance methods
eventRegistrationSchema.methods.updateContactInfo = function (
  name?: string,
  email?: string,
  phone?: string
) {
  if (name) this.name = name.trim();
  if (email) this.email = email.toLowerCase().trim();
  if (phone) this.phone = phone.trim();
  return this.save();
};

eventRegistrationSchema.methods.linkToUser = function (
  userId: mongoose.Types.ObjectId
) {
  this.user = userId;
  return this.save();
};

eventRegistrationSchema.methods.unlinkFromUser = function () {
  this.user = undefined;
  return this.save();
};

// Add indexes for better query performance
eventRegistrationSchema.index({ event: 1 });
eventRegistrationSchema.index({ user: 1 });
eventRegistrationSchema.index({ email: 1 });
eventRegistrationSchema.index({ phone: 1 });
eventRegistrationSchema.index({ registeredAt: -1 });
eventRegistrationSchema.index({ event: 1, email: 1 }, { unique: true }); // Prevent duplicate registrations

const EventRegistration = mongoose.model<IEventRegistrationDocument>(
  'EventRegistration',
  eventRegistrationSchema
);

export default EventRegistration;
