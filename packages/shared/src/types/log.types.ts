// Log related types and interfaces (for audit logging)

export type LogAction = 'CREATE' | 'EDIT' | 'DELETE';

export type LogTargetType = 'USER' | 'ROLE' | 'CLUB' | 'EVENT' | 'OTHER';

export interface Log {
  _id: string;
  user: string; // User ID (Admin/Moderator who performed the action)
  affectedUser?: string; // User ID (User who was affected by the action)
  action: LogAction;
  targetType: LogTargetType;
  targetId: string; // ID of the affected entity
  details?: string; // Optional description of the action
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLogRequest {
  user: string; // User ID
  affectedUser?: string; // User ID
  action: LogAction;
  targetType: LogTargetType;
  targetId: string;
  details?: string;
}

export interface LogFilterOptions {
  user?: string;
  affectedUser?: string;
  action?: LogAction;
  targetType?: LogTargetType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface LogStats {
  total: number;
  byAction: { [action in LogAction]: number };
  byTargetType: { [targetType in LogTargetType]: number };
  byUser: { [userId: string]: number };
  recent: number; // Last 7 days
}

export interface AuditTrail {
  logs: Log[];
  totalCount: number;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}
