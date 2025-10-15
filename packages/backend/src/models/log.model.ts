import mongoose, { Document, Schema } from 'mongoose';
import {
  type Log as ILog,
  LogAction,
  LogTargetType,
} from '@event-management/shared';

// Mongoose Document interface with ObjectId references
export interface ILogDocument extends Document {
  user: mongoose.Types.ObjectId; // Admin/Moderator who performed the action
  affectedUser?: mongoose.Types.ObjectId; // User who was affected by the action
  action: LogAction;
  targetType: LogTargetType;
  targetId: mongoose.Types.ObjectId; // ID of the affected entity
  details?: string; // Optional description of the action
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const logSchema = new Schema<ILogDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model (Admin/Moderator who performed the action)
      required: true,
    },
    affectedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model (User who was affected)
    },
    action: {
      type: String,
      enum: ['CREATE', 'EDIT', 'DELETE'] as LogAction[],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['USER', 'ROLE', 'CLUB', 'EVENT', 'OTHER'] as LogTargetType[], // What entity was affected
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId, // ID of the affected entity
      required: true,
    },
    details: {
      type: String, // Optional description of the action
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Static methods
logSchema.statics.findByUser = function (userId: string) {
  return this.find({ user: userId })
    .populate('user', 'name email role')
    .populate('affectedUser', 'name email')
    .sort({ timestamp: -1 });
};

logSchema.statics.findByAffectedUser = function (affectedUserId: string) {
  return this.find({ affectedUser: affectedUserId })
    .populate('user', 'name email role')
    .populate('affectedUser', 'name email')
    .sort({ timestamp: -1 });
};

logSchema.statics.findByAction = function (action: LogAction) {
  return this.find({ action })
    .populate('user', 'name email role')
    .populate('affectedUser', 'name email')
    .sort({ timestamp: -1 });
};

logSchema.statics.findByTargetType = function (targetType: LogTargetType) {
  return this.find({ targetType })
    .populate('user', 'name email role')
    .populate('affectedUser', 'name email')
    .sort({ timestamp: -1 });
};

logSchema.statics.findByTarget = function (targetId: string) {
  return this.find({ targetId })
    .populate('user', 'name email role')
    .populate('affectedUser', 'name email')
    .sort({ timestamp: -1 });
};

logSchema.statics.findRecent = function (days: number = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.find({ timestamp: { $gte: dateThreshold } })
    .populate('user', 'name email role')
    .populate('affectedUser', 'name email')
    .sort({ timestamp: -1 });
};

logSchema.statics.getAuditTrail = function (
  startDate: Date,
  endDate: Date,
  limit: number = 100
) {
  return this.find({
    timestamp: { $gte: startDate, $lte: endDate },
  })
    .populate('user', 'name email role')
    .populate('affectedUser', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

logSchema.statics.getStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        recent: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$timestamp',
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ],
              },
              1,
              0,
            ],
          },
        },
        byAction: {
          $push: {
            action: '$action',
            count: 1,
          },
        },
        byTargetType: {
          $push: {
            targetType: '$targetType',
            count: 1,
          },
        },
        byUser: {
          $push: {
            user: '$user',
            count: 1,
          },
        },
      },
    },
  ]);
};

// Instance methods
logSchema.methods.addDetails = function (additionalDetails: string) {
  this.details = this.details
    ? `${this.details}; ${additionalDetails}`
    : additionalDetails;
  return this.save();
};

// Static method to create a log entry
logSchema.statics.createLog = function (
  userId: mongoose.Types.ObjectId,
  action: LogAction,
  targetType: LogTargetType,
  targetId: mongoose.Types.ObjectId,
  details?: string,
  affectedUserId?: mongoose.Types.ObjectId
) {
  return this.create({
    user: userId,
    affectedUser: affectedUserId,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date(),
  });
};

// Add indexes for better query performance
logSchema.index({ user: 1 });
logSchema.index({ affectedUser: 1 });
logSchema.index({ action: 1 });
logSchema.index({ targetType: 1 });
logSchema.index({ targetId: 1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ targetType: 1, targetId: 1 });

const Log = mongoose.model<ILogDocument>('Log', logSchema);

export default Log;
