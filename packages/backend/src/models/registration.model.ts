import mongoose, { Document, Schema } from 'mongoose';
import {
  type Registration as IRegistration,
  RegistrationCustomFields,
} from '@event-management/shared';

// Mongoose Document interface with ObjectId references
export interface IRegistrationDocument extends Document {
  recruitment: mongoose.Types.ObjectId;
  name: string;
  email: string;
  customFields: RegistrationCustomFields;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistrationDocument>(
  {
    recruitment: {
      type: Schema.Types.ObjectId,
      ref: 'Recruitment',
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
    customFields: {
      type: Object,
      default: {},
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
registrationSchema.statics.findByRecruitment = function (
  recruitmentId: string
) {
  return this.find({ recruitment: recruitmentId })
    .populate('recruitment', 'title deadline')
    .sort({ registeredAt: -1 });
};

registrationSchema.statics.findByEmail = function (email: string) {
  return this.find({ email })
    .populate('recruitment', 'title deadline club')
    .sort({ registeredAt: -1 });
};

registrationSchema.statics.findRecent = function (days: number = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.find({ registeredAt: { $gte: dateThreshold } })
    .populate('recruitment', 'title deadline club')
    .sort({ registeredAt: -1 });
};

registrationSchema.statics.getStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: '$recruitment',
        count: { $sum: 1 },
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
        totalRecent: { $sum: '$recent' },
        byRecruitment: {
          $push: {
            recruitmentId: '$_id',
            count: '$count',
          },
        },
      },
    },
  ]);
};

// Instance methods
registrationSchema.methods.updateCustomFields = function (
  newFields: RegistrationCustomFields
) {
  this.customFields = { ...this.customFields, ...newFields };
  return this.save();
};

registrationSchema.methods.updateEmail = function (newEmail: string) {
  this.email = newEmail.toLowerCase().trim();
  return this.save();
};

registrationSchema.methods.updateName = function (newName: string) {
  this.name = newName.trim();
  return this.save();
};

// Add indexes for better query performance
registrationSchema.index({ recruitment: 1 });
registrationSchema.index({ email: 1 });
registrationSchema.index({ registeredAt: -1 });
registrationSchema.index({ recruitment: 1, email: 1 }, { unique: true }); // Prevent duplicate registrations

const Registration = mongoose.model<IRegistrationDocument>(
  'Registration',
  registrationSchema
);

export default Registration;
