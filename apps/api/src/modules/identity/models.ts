import mongoose, { Schema } from 'mongoose';
import type { AccessScope, ErpModule, PermissionVerb, RoleKey } from '@cas-erp/shared';

export interface IUser {
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  passwordHash: string;
  status: 'active' | 'suspended' | 'dormant' | 'pending';
  mfaEnabled: boolean;
  mfaSecretEncrypted?: string;
  mfaRecoveryCodeHashes: string[];
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  lastLoginAt?: Date | null;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    language: 'en' | 'hi';
  };
  linkedStudentId?: mongoose.Types.ObjectId | null;
  linkedEmployeeId?: mongoose.Types.ObjectId | null;
  sourceSystemRef?: {
    sourceSystem: string;
    sourceId: string;
    migrationBatchId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'suspended', 'dormant', 'pending'],
      default: 'active'
    },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecretEncrypted: { type: String },
    mfaRecoveryCodeHashes: { type: [String], default: [] },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'light' },
      accentColor: { type: String, default: '#3587A4' },
      language: { type: String, enum: ['en', 'hi'], default: 'en' }
    },
    linkedStudentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
    linkedEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    sourceSystemRef: {
      sourceSystem: String,
      sourceId: String,
      migrationBatchId: String
    }
  },
  { timestamps: true, versionKey: false }
);

userSchema.index({ status: 1 });
export const User = mongoose.model<IUser>('User', userSchema);

export interface IRoleTemplate {
  key: string;
  name: string;
  nameHi: string;
  description: string;
  isSystemRole: boolean;
  requiresMfaRecommended: boolean;
  permissions: Array<{
    module: ErpModule;
    actions: PermissionVerb[];
    scope: AccessScope;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const roleTemplateSchema = new Schema<IRoleTemplate>(
  {
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isSystemRole: { type: Boolean, default: false },
    requiresMfaRecommended: { type: Boolean, default: false },
    permissions: [
      {
        _id: false,
        module: { type: String, required: true },
        actions: { type: [String], default: [] },
        scope: {
          type: String,
          enum: ['all', 'department', 'assigned', 'own', 'linked-student', 'hostel', 'pool-assigned'],
          default: 'own'
        }
      }
    ]
  },
  { timestamps: true, versionKey: false }
);

export const RoleTemplate = mongoose.model<IRoleTemplate>('RoleTemplate', roleTemplateSchema);

export interface IRoleAssignment {
  userId: mongoose.Types.ObjectId;
  roleKey: RoleKey | string;
  scope: {
    departmentIds: mongoose.Types.ObjectId[];
    programIds: mongoose.Types.ObjectId[];
    subjectIds: mongoose.Types.ObjectId[];
    hostelIds: mongoose.Types.ObjectId[];
  };
  isPrimary: boolean;
  delegatedByUserId?: mongoose.Types.ObjectId | null;
  validUntil?: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleAssignmentSchema = new Schema<IRoleAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roleKey: { type: String, required: true, uppercase: true, trim: true },
    scope: {
      departmentIds: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
      programIds: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
      subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
      hostelIds: [{ type: Schema.Types.ObjectId, ref: 'Hostel' }]
    },
    isPrimary: { type: Boolean, default: false },
    delegatedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    validUntil: { type: Date, default: null },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

roleAssignmentSchema.index({ userId: 1, active: 1 });
roleAssignmentSchema.index({ roleKey: 1, active: 1 });
export const RoleAssignment = mongoose.model<IRoleAssignment>('RoleAssignment', roleAssignmentSchema);

export interface ISession {
  userId: mongoose.Types.ObjectId;
  activeRoleKey: string;
  refreshTokenHash: string;
  deviceLabel: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastUsedAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    activeRoleKey: { type: String, required: true },
    refreshTokenHash: { type: String, required: true, unique: true },
    deviceLabel: { type: String, default: 'Web Browser' },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true, versionKey: false }
);

sessionSchema.index({ userId: 1, revokedAt: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Session = mongoose.model<ISession>('Session', sessionSchema);

export interface IPasswordResetToken {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const PasswordResetToken = mongoose.model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);

export interface IBreakGlassLog {
  userId: mongoose.Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  reason: string;
  targetModule: string;
  ticketRef?: string;
  expiresAt: Date;
  createdAt: Date;
}

const breakGlassLogSchema = new Schema<IBreakGlassLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    targetModule: { type: String, required: true, trim: true },
    ticketRef: { type: String, trim: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true, versionKey: false }
);

breakGlassLogSchema.index({ createdAt: -1 });
breakGlassLogSchema.index({ expiresAt: 1 });
export const BreakGlassLog = mongoose.model<IBreakGlassLog>('BreakGlassLog', breakGlassLogSchema);


