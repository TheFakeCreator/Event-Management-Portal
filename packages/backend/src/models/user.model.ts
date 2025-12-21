import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import {
  User,
  UserSocials,
  UserClub,
  Gender,
  UserRole,
} from '@event-management/shared';

// Mongoose document interface extending our shared User interface
export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  googleId?: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  gender: Gender;
  avatar: string;
  bio?: string;
  phone?: string;
  socials: UserSocials;
  clubs: UserClub[];
  moderatorClubs: Types.ObjectId[];
  createdEvents: Types.ObjectId[];
  participatedEvents: Types.ObjectId[];
  isVerified: boolean;
  verificationToken?: string;
  role: UserRole;
  roleRequest?: UserRole | null;
  lastLogin?: Date;
  resetToken?: string;
  expireToken?: Date;
  isDeleted: boolean;
  failedLoginAttempts: number;
  accountLockUntil?: Date;
  lastPasswordChange: Date;
  passwordHistory: Array<{
    hash: string;
    createdAt: Date;
  }>;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  isLocked: boolean;

  // Instance methods
  incFailedAttempts(): Promise<any>;
  resetFailedAttempts(): Promise<any>;
  addPasswordToHistory(hashedPassword: string): void;
}

// Model interface
export interface IUserModel extends Model<IUserDocument> {
  // Static methods can be added here if needed
}

// Password history sub-schema
const passwordHistorySchema = new Schema({
  hash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// User schema definition
const userSchema = new Schema<IUserDocument>(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'] as const,
      default: 'other' as Gender,
    },
    avatar: {
      type: String,
      default: '/images/male.jpg',
    },
    bio: {
      type: String,
      maxlength: 250,
    },
    phone: {
      type: String,
    },
    socials: {
      linkedin: { type: String },
      github: { type: String },
      behance: { type: String },
    },
    clubs: [
      {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'Club',
        },
        designation: {
          type: String,
        },
      },
    ],
    moderatorClubs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Club',
      },
    ],
    createdEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    participatedEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'member', 'moderator'] as const,
      default: 'user' as UserRole,
    },
    roleRequest: {
      type: String,
      enum: ['admin', 'user', 'moderator', 'member', null] as const,
      default: null,
    },
    lastLogin: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    expireToken: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Password Security Fields
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockUntil: {
      type: Date,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    passwordHistory: [passwordHistorySchema],
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
  }
);

// Virtual field to check if account is locked
userSchema.virtual('isLocked').get(function (this: IUserDocument) {
  return !!(this.accountLockUntil && this.accountLockUntil > new Date());
});

// Method to increment failed login attempts
userSchema.methods.incFailedAttempts = function (this: IUserDocument) {
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockUntil && this.accountLockUntil < new Date()) {
    return this.updateOne({
      $unset: {
        accountLockUntil: 1,
      },
      $set: {
        failedLoginAttempts: 1,
      },
    });
  }

  const updates: any = { $inc: { failedLoginAttempts: 1 } };

  // If we've reached max attempts and it's not locked already, lock the account
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      accountLockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // Lock for 2 hours
    };
  }

  return this.updateOne(updates);
};

// Method to reset failed login attempts
userSchema.methods.resetFailedAttempts = function (this: IUserDocument) {
  return this.updateOne({
    $unset: {
      failedLoginAttempts: 1,
      accountLockUntil: 1,
    },
  });
};

// Method to add password to history
userSchema.methods.addPasswordToHistory = function (
  this: IUserDocument,
  hashedPassword: string
) {
  // Keep only last 5 passwords
  const history = this.passwordHistory || [];
  history.unshift({ hash: hashedPassword, createdAt: new Date() });

  // Keep only the last 5 passwords
  if (history.length > 5) {
    history.splice(5);
  }

  this.passwordHistory = history;
  this.lastPasswordChange = new Date();
};

// Create and export the model
export const UserModel = mongoose.model<IUserDocument, IUserModel>(
  'User',
  userSchema
);

export default UserModel;
