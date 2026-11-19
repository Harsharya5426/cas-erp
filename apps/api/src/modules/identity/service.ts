import mongoose from 'mongoose';
import { ERROR_CODES } from '@cas-erp/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../core/errors.js';
import {
  computeTotpCode,
  decryptSensitiveValue,
  encryptSensitiveValue,
  generateOpaqueToken,
  generateTotpSecret,
  hashPassword,
  sha256Hex,
  verifyPassword,
  verifyTotpCode
} from '../../core/crypto.js';
import { resolveAuthContext, signAccessToken } from '../../core/rbac.js';
import { recordAuditEvent } from '../../core/audit.js';
import { PasswordResetToken, RoleAssignment, Session, User } from './models.js';
import type { Request } from 'express';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  auth: Awaited<ReturnType<typeof resolveAuthContext>>;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    mfaEnabled: boolean;
    preferences: {
      theme: 'dark' | 'light' | 'system';
      accentColor: string;
      language: 'en' | 'hi';
    };
  };
}

export async function authenticateUser(params: {
  email: string;
  password: string;
  mfaCode?: string;
  deviceLabel?: string;
  req?: Request;
}): Promise<LoginResult> {
  const email = params.email.trim().toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    await recordAuditEvent({
      req: params.req,
      actor: { email, name: 'Anonymous', role: 'ANON' },
      action: 'Failed login attempt (unknown email)',
      category: 'identity',
      resourceType: 'User',
      resourceId: email,
      outcome: 'failure'
    });
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid email or password');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(
      423,
      ERROR_CODES.ACCOUNT_LOCKED,
      `Account temporarily locked due to repeated failed attempts. Try again after ${user.lockedUntil.toISOString()}`
    );
  }

  if (user.status !== 'active') {
    throw new AppError(403, ERROR_CODES.FORBIDDEN, `Account status is ${user.status}`);
  }

  const passwordValid = await verifyPassword(params.password, user.passwordHash);
  if (!passwordValid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
    }
    await user.save();

    await recordAuditEvent({
      req: params.req,
      actor: { id: user._id, email: user.email, name: user.name, role: 'USER' },
      action: 'Failed login attempt (invalid password)',
      category: 'identity',
      resourceType: 'User',
      resourceId: String(user._id),
      outcome: 'failure',
      metadata: { failedLoginAttempts: user.failedLoginAttempts }
    });
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid email or password');
  }

  let mfaVerified = false;
  if (user.mfaEnabled) {
    if (!params.mfaCode) {
      throw new AppError(401, ERROR_CODES.MFA_REQUIRED, 'Multi-factor authentication code is required');
    }
    const secret = user.mfaSecretEncrypted ? decryptSensitiveValue(user.mfaSecretEncrypted) : '';
    const totpValid = secret ? verifyTotpCode(secret, params.mfaCode) : false;
    let recoveryUsed = false;

    if (!totpValid) {
      const candidateHash = sha256Hex(params.mfaCode.trim().toUpperCase());
      const idx = user.mfaRecoveryCodeHashes.indexOf(candidateHash);
      if (idx !== -1) {
        user.mfaRecoveryCodeHashes.splice(idx, 1);
        recoveryUsed = true;
      }
    }

    if (!totpValid && !recoveryUsed) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid MFA verification code');
    }
    mfaVerified = true;
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const initialAuth = await resolveAuthContext(String(user._id), 'pending', undefined, mfaVerified);
  const rawRefreshToken = generateOpaqueToken(40);
  const refreshExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86_400_000);

  const session = await Session.create({
    userId: user._id,
    activeRoleKey: initialAuth.activeRole,
    refreshTokenHash: sha256Hex(rawRefreshToken),
    deviceLabel: params.deviceLabel || 'Web Browser',
    ipAddress: params.req?.ip,
    userAgent: params.req?.get('user-agent'),
    expiresAt: refreshExpiresAt
  });

  const auth = { ...initialAuth, sessionId: String(session._id) };
  const accessToken = signAccessToken({
    sub: String(user._id),
    sid: String(session._id),
    role: auth.activeRole,
    mfa: mfaVerified
  });

  await recordAuditEvent({
    req: params.req,
    actor: { id: user._id, email: user.email, name: user.name, role: auth.activeRole },
    action: 'User authenticated successfully',
    category: 'identity',
    resourceType: 'Session',
    resourceId: String(session._id),
    outcome: 'success',
    metadata: { mfaVerified }
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresInSeconds: 900,
    auth,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      mfaEnabled: user.mfaEnabled,
      preferences: user.preferences
    }
  };
}

export async function rotateRefreshSession(rawRefreshToken: string, req?: Request): Promise<LoginResult> {
  const hash = sha256Hex(rawRefreshToken);
  const session = await Session.findOne({ refreshTokenHash: hash });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Refresh session invalid or expired');
  }

  const user = await User.findById(session.userId);
  if (!user || user.status !== 'active') {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Account inactive');
  }

  const nextRefresh = generateOpaqueToken(40);
  session.refreshTokenHash = sha256Hex(nextRefresh);
  session.lastUsedAt = new Date();
  session.expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86_400_000);
  await session.save();

  const auth = await resolveAuthContext(
    String(user._id),
    String(session._id),
    session.activeRoleKey,
    user.mfaEnabled
  );
  const accessToken = signAccessToken({
    sub: String(user._id),
    sid: String(session._id),
    role: auth.activeRole,
    mfa: user.mfaEnabled
  });

  if (req) {
    await recordAuditEvent({
      req,
      actor: { id: user._id, email: user.email, name: user.name, role: auth.activeRole },
      action: 'Refreshed session token',
      category: 'identity',
      resourceType: 'Session',
      resourceId: String(session._id)
    });
  }

  return {
    accessToken,
    refreshToken: nextRefresh,
    expiresInSeconds: 900,
    auth,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      mfaEnabled: user.mfaEnabled,
      preferences: user.preferences
    }
  };
}

export async function beginMfaSetup(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');

  const secret = generateTotpSecret();
  const recoveryCodes = Array.from({ length: 6 }, () =>
    generateOpaqueToken(5).toUpperCase().slice(0, 8)
  );
  user.mfaSecretEncrypted = encryptSensitiveValue(secret);
  user.mfaRecoveryCodeHashes = recoveryCodes.map((c) => sha256Hex(c));
  await user.save();

  const issuer = encodeURIComponent('CAS ERP (AKTU)');
  const account = encodeURIComponent(user.email);
  return {
    secret,
    otpauthUri: `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`,
    recoveryCodes,
    previewCode: env.NODE_ENV === 'test' ? computeTotpCode(secret) : undefined
  };
}

export async function verifyAndEnableMfa(userId: string, code: string, req?: Request) {
  const user = await User.findById(userId);
  if (!user || !user.mfaSecretEncrypted) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'MFA setup has not been initialized');
  }
  const secret = decryptSensitiveValue(user.mfaSecretEncrypted);
  if (!verifyTotpCode(secret, code)) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid TOTP verification code');
  }
  user.mfaEnabled = true;
  await user.save();

  await recordAuditEvent({
    req,
    actor: { id: user._id, email: user.email, name: user.name, role: 'USER' },
    action: 'Enabled TOTP Multi-Factor Authentication',
    category: 'identity',
    resourceType: 'User',
    resourceId: String(user._id)
  });
}

export async function requestPasswordReset(email: string, req?: Request) {
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) return { accepted: true };

  const token = generateOpaqueToken(24);
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: sha256Hex(token),
    expiresAt: new Date(Date.now() + 30 * 60_000)
  });

  await recordAuditEvent({
    req,
    actor: { id: user._id, email: user.email, name: user.name, role: 'USER' },
    action: 'Requested password reset token',
    category: 'identity',
    resourceType: 'User',
    resourceId: String(user._id)
  });

  return {
    accepted: true,
    // Exposed strictly in test mode for automated integration tests; never in production
    ...(env.NODE_ENV === 'test' ? { testResetToken: token } : {})
  };
}

export async function confirmPasswordReset(token: string, newPassword: string, req?: Request) {
  const record = await PasswordResetToken.findOne({
    tokenHash: sha256Hex(token),
    usedAt: null,
    expiresAt: { $gt: new Date() }
  });
  if (!record) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid or expired password reset token');
  }

  const user = await User.findById(record.userId);
  if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');

  user.passwordHash = await hashPassword(newPassword);
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });

  await recordAuditEvent({
    req,
    actor: { id: user._id, email: user.email, name: user.name, role: 'USER' },
    action: 'Completed password reset and revoked active sessions',
    category: 'identity',
    resourceType: 'User',
    resourceId: String(user._id)
  });
}

export async function assignRoleToUser(params: {
  userId: string;
  roleKey: string;
  departmentIds?: string[];
  hostelIds?: string[];
  isPrimary?: boolean;
  validUntil?: string | null;
  delegatedByUserId?: string;
}) {
  const exists = await User.exists({ _id: params.userId });
  if (!exists) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');

  if (params.isPrimary) {
    await RoleAssignment.updateMany({ userId: params.userId }, { $set: { isPrimary: false } });
  }

  return RoleAssignment.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    roleKey: params.roleKey.toUpperCase(),
    scope: {
      departmentIds: (params.departmentIds || []).map((id) => new mongoose.Types.ObjectId(id)),
      programIds: [],
      subjectIds: [],
      hostelIds: (params.hostelIds || []).map((id) => new mongoose.Types.ObjectId(id))
    },
    isPrimary: Boolean(params.isPrimary),
    delegatedByUserId: params.delegatedByUserId
      ? new mongoose.Types.ObjectId(params.delegatedByUserId)
      : null,
    validUntil: params.validUntil ? new Date(params.validUntil) : null,
    active: true
  });
}

