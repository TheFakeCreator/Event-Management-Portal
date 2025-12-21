import mongoose, { Document, Schema } from 'mongoose';
import {
  type Event as IEvent,
  EventType,
  EventSponsor,
  EventWinner,
  EventReport,
  EventReportReason,
  EventReportStatus,
} from '@event-management/shared';

// Mongoose Document interface with ObjectId references
export interface IEventDocument extends Document {
  title: string;
  description: string;
  Type: EventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  image: string;
  club?: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  registeredUsers: number;
  sponsors: EventSponsor[];
  winners: EventWinner[];
  eventLeads: mongoose.Types.ObjectId[];
  preEventNotes?: string;
  postEventNotes?: string;
  reports: (Omit<EventReport, 'reportedBy'> & {
    reportedBy: mongoose.Types.ObjectId;
  })[];
  createdBy: mongoose.Types.ObjectId;
  visibility?: 'public' | 'private' | 'club-only';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEventDocument>({
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
      'Workshops',
      'Talks',
      'Workshops & Talks',
      'Meetups',
      'Networking',
      'Fun',
      'Tech',
      'Other',
    ] as EventType[],
    required: true,
    default: 'Other' as EventType,
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
    ref: 'Club',
  },
  collaborators: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Club',
    },
  ],
  registeredUsers: {
    type: Number,
    default: 0,
  },
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
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      prize: {
        type: String,
      },
    },
  ],
  eventLeads: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  preEventNotes: {
    type: String,
  },
  postEventNotes: {
    type: String,
  },
  reports: [
    {
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      reason: {
        type: String,
        enum: [
          'inappropriate_content',
          'misleading_information',
          'unauthorized_collaboration',
          'spam',
          'other',
        ] as EventReportReason[],
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
        enum: ['pending', 'resolved', 'dismissed'] as EventReportStatus[],
        default: 'pending' as EventReportStatus,
      },
    },
  ],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'club-only'],
    default: 'public',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
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

// Update the updatedAt field on save
eventSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
eventSchema.statics.findByClub = function (clubId: string) {
  return this.find({ club: clubId });
};

eventSchema.statics.findUpcoming = function () {
  return this.find({ startDate: { $gte: new Date() } });
};

eventSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
  });
};

// Instance methods
eventSchema.methods.addSponsor = function (sponsor: EventSponsor) {
  this.sponsors.push(sponsor);
  return this.save();
};

eventSchema.methods.addWinner = function (winner: EventWinner) {
  this.winners.push(winner);
  return this.save();
};

eventSchema.methods.addReport = function (
  report: Omit<EventReport, 'reportedAt' | 'status'>
) {
  this.reports.push({
    ...report,
    reportedAt: new Date(),
    status: 'pending',
  });
  return this.save();
};

eventSchema.methods.updateRegistrationCount = function () {
  // This would be updated when implementing EventRegistration model
  // For now, keeping the manual count
  return this.save();
};

// Add indexes for better query performance
eventSchema.index({ club: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ Type: 1 });
eventSchema.index({ 'reports.status': 1 });

const Event = mongoose.model<IEventDocument>('Event', eventSchema);

export default Event;
