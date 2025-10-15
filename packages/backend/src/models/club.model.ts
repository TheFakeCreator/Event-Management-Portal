import mongoose, { Document, Schema } from 'mongoose';
import {
  type Club as IClub,
  ClubSponsor,
  ClubSocials,
  ClubGalleryItem,
} from '@event-management/shared';

// Mongoose Document interface with ObjectId references
export interface IClubDocument extends Document {
  name: string;
  description: string;
  about?: string;
  image?: string;
  banner?: string;
  domains: string[];
  sponsors: ClubSponsor[];
  recruitments: mongoose.Types.ObjectId[];
  social: ClubSocials;
  gallery: (Omit<ClubGalleryItem, 'uploadedBy'> & {
    uploadedBy: mongoose.Types.ObjectId;
  })[];
  events: mongoose.Types.ObjectId[];
  currentOc: mongoose.Types.ObjectId[];
  pastOc: mongoose.Types.ObjectId[];
  currentMembers: mongoose.Types.ObjectId[];
  pastMembers: mongoose.Types.ObjectId[];
  moderators: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clubSchema = new Schema<IClubDocument>(
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
        ref: 'Recruitment',
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
          required: true,
        },
        caption: {
          type: String,
        },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
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
        ref: 'Event',
      },
    ],
    currentOc: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pastOc: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    currentMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pastMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static methods
clubSchema.statics.findByDomain = function (domain: string) {
  return this.find({ domains: domain });
};

clubSchema.statics.findByModerator = function (userId: string) {
  return this.find({ moderators: userId });
};

clubSchema.statics.findActiveClubs = function () {
  return this.find({
    $or: [{ currentOc: { $ne: [] } }, { currentMembers: { $ne: [] } }],
  });
};

// Instance methods
clubSchema.methods.addMember = function (
  userId: mongoose.Types.ObjectId,
  role: 'currentOc' | 'currentMember' | 'moderator'
) {
  if (!this[role].includes(userId)) {
    this[role].push(userId);
  }
  return this.save();
};

clubSchema.methods.removeMember = function (
  userId: mongoose.Types.ObjectId,
  fromRole: 'currentOc' | 'currentMember' | 'moderator'
) {
  this[fromRole] = this[fromRole].filter(
    (id: mongoose.Types.ObjectId) => !id.equals(userId)
  );
  return this.save();
};

clubSchema.methods.moveToPast = function (
  userId: mongoose.Types.ObjectId,
  fromRole: 'currentOc' | 'currentMember'
) {
  const pastRole = fromRole === 'currentOc' ? 'pastOc' : 'pastMembers';

  // Remove from current role
  this[fromRole] = this[fromRole].filter(
    (id: mongoose.Types.ObjectId) => !id.equals(userId)
  );

  // Add to past role if not already there
  if (!this[pastRole].includes(userId)) {
    this[pastRole].push(userId);
  }

  return this.save();
};

clubSchema.methods.addSponsor = function (sponsor: ClubSponsor) {
  this.sponsors.push(sponsor);
  return this.save();
};

clubSchema.methods.addGalleryItem = function (
  galleryItem: Omit<ClubGalleryItem, 'uploadedBy' | 'uploadedAt'> & {
    uploadedBy: mongoose.Types.ObjectId;
  }
) {
  this.gallery.push({
    ...galleryItem,
    uploadedAt: new Date(),
  });
  return this.save();
};

clubSchema.methods.addEvent = function (eventId: mongoose.Types.ObjectId) {
  if (!this.events.includes(eventId)) {
    this.events.push(eventId);
  }
  return this.save();
};

clubSchema.methods.removeEvent = function (eventId: mongoose.Types.ObjectId) {
  this.events = this.events.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(eventId)
  );
  return this.save();
};

// Add indexes for better query performance
clubSchema.index({ name: 1 });
clubSchema.index({ domains: 1 });
clubSchema.index({ moderators: 1 });
clubSchema.index({ currentOc: 1 });
clubSchema.index({ currentMembers: 1 });
clubSchema.index({ createdBy: 1 });

const Club = mongoose.model<IClubDocument>('Club', clubSchema);

export default Club;
