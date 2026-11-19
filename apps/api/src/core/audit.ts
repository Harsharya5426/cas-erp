import mongoose, { Schema } from 'mongoose';
import type { Request } from 'express';
import type { RequestWithContext } from './requestContext.js';

export interface IAuditEvent {
  actorId?: mongoose.Types.ObjectId | null;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: string;
  category:
    | 'identity'
    | 'rbac'
    | 'academic'
    | 'admissions'
    | 'attendance'
    | 'finance'
    | 'accounting'
    | 'exams'
    | 'hr'
    | 'leave'
    | 'campus'
    | 'grievance'
    | 'system'
    | 'migration'
    | 'ai';
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'denied' | 'failure';
  metadata?: Record<string, unknown>;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditEventSchema = new Schema<IAuditEvent>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorEmail: { type: String, required: true, default: 'system@cas.res.in' },
    actorName: { type: String, required: true, default: 'System' },
    actorRole: { type: String, required: true, default: 'SYSTEM' },
    action: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'identity',
        'rbac',
        'academic',
        'admissions',
        'attendance',
        'finance',
        'accounting',
        'exams',
        'hr',
        'leave',
        'campus',
        'grievance',
        'system',
        'migration',
        'ai'
      ]
    },
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    outcome: { type: String, enum: ['success', 'denied', 'failure'], default: 'success' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    requestId: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ category: 1, createdAt: -1 });
auditEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditEventSchema.index({ actorId: 1, createdAt: -1 });

// Enforce append-only immutability on audit records per PRD 18
const blockMutation = function (this: unknown, next: (err?: Error) => void) {
  next(new Error('AuditEvent records are strictly append-only and cannot be modified or deleted.'));
};

auditEventSchema.pre('updateOne', blockMutation);
auditEventSchema.pre('updateMany', blockMutation);
auditEventSchema.pre('findOneAndUpdate', blockMutation);
auditEventSchema.pre('deleteOne', blockMutation);
auditEventSchema.pre('deleteMany', blockMutation);
auditEventSchema.pre('findOneAndDelete', blockMutation);

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', auditEventSchema);

export interface AuditLogInput {
  req?: Request;
  actor?: {
    id?: string | mongoose.Types.ObjectId | null;
    email?: string;
    name?: string;
    role?: string;
  };
  action: string;
  category: IAuditEvent['category'];
  resourceType: string;
  resourceId: string;
  outcome?: 'success' | 'denied' | 'failure';
  metadata?: Record<string, unknown>;
}

export async function recordAuditEvent(input: AuditLogInput): Promise<void> {
  const reqAny = input.req as (RequestWithContext & { auth?: { userId: string; email: string; name: string; activeRole: string } }) | undefined;
  const actorId = input.actor?.id ?? reqAny?.auth?.userId ?? null;
  const actorEmail = input.actor?.email ?? reqAny?.auth?.email ?? 'system@cas.res.in';
  const actorName = input.actor?.name ?? reqAny?.auth?.name ?? 'System';
  const actorRole = input.actor?.role ?? reqAny?.auth?.activeRole ?? 'SYSTEM';
  const requestId = reqAny?.requestId ?? 'internal';

  await AuditEvent.create({
    actorId: actorId ? new mongoose.Types.ObjectId(String(actorId)) : null,
    actorEmail,
    actorName,
    actorRole,
    action: input.action,
    category: input.category,
    resourceType: input.resourceType,
    resourceId: String(input.resourceId),
    outcome: input.outcome ?? 'success',
    metadata: input.metadata ?? {},
    requestId,
    ipAddress: reqAny?.ip,
    userAgent: reqAny?.get?.('user-agent')
  });
}

