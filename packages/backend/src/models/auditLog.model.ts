import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// Audit log action types
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'role_change'
  | 'permission_change';

// Audit log resource types
export type AuditResource =
  | 'user'
  | 'event'
  | 'club'
  | 'registration'
  | 'announcement'
  | 'system';

// Mongoose document interface
export interface IAuditLogDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: Types.ObjectId;
  changes?: any;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    [key: string]: any;
  };
  timestamp: Date;
  createdAt: Date;
}

// Model interface
export interface IAuditLogModel extends Model<IAuditLogDocument> {
  // Static methods
  logAction(
    userId: Types.ObjectId,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: Types.ObjectId,
    changes?: any,
    metadata?: any
  ): Promise<IAuditLogDocument>;
}

// Audit log schema
const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'create',
        'update',
        'delete',
        'login',
        'logout',
        'role_change',
        'permission_change',
      ] as const,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      enum: [
        'user',
        'event',
        'club',
        'registration',
        'announcement',
        'system',
      ] as const,
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
      location: { type: String },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log actions
auditLogSchema.statics.logAction = async function (
  userId: Types.ObjectId,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: Types.ObjectId,
  changes?: any,
  metadata?: any
): Promise<IAuditLogDocument> {
  return this.create({
    userId,
    action,
    resource,
    resourceId,
    changes,
    metadata,
    timestamp: new Date(),
  });
};

// Create and export the model
export const AuditLogModel = mongoose.model<IAuditLogDocument, IAuditLogModel>(
  'AuditLog',
  auditLogSchema
);

export default AuditLogModel;
