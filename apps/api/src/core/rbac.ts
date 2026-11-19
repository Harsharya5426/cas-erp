import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  ERROR_CODES,
  type AccessScope,
  type ErpModule,
  type ModulePermissionRule,
  type PermissionVerb
} from '@cas-erp/shared';
import { env } from '../config/env.js';
import { AppError } from './errors.js';
import { recordAuditEvent } from './audit.js';
import { RoleAssignment, RoleTemplate, Session, User } from '../modules/identity/models.js';

export interface AuthContext {
  userId: string;
  sessionId: string;
  email: string;
  name: string;
  activeRole: string;
  assignedRoles: string[];
  permissions: ModulePermissionRule[];
  linkedStudentId?: string | null;
  linkedEmployeeId?: string | null;
  mfaVerified: boolean;
  scopes: {
    departmentIds: string[];
    programIds: string[];
    subjectIds: string[];
    hostelIds: string[];
  };
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
  requestId: string;
}

interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: string;
  mfa: boolean;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn']
  });
}

export async function resolveAuthContext(
  userId: string,
  sessionId: string,
  preferredRole?: string,
  mfaVerified = false
): Promise<AuthContext> {
  const user = await User.findById(userId).lean();
  if (!user || user.status !== 'active') {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Account is inactive or unavailable');
  }

  const now = new Date();
  const assignments = await RoleAssignment.find({
    userId: user._id,
    active: true,
    $or: [{ validUntil: null }, { validUntil: { $gt: now } }]
  }).lean();

  if (assignments.length === 0) {
    throw new AppError(403, ERROR_CODES.FORBIDDEN, 'No active role assignments found for account');
  }

  const assignedRoles = [...new Set(assignments.map((a) => a.roleKey))];
  const activeRole =
    preferredRole && assignedRoles.includes(preferredRole)
      ? preferredRole
      : (assignments.find((a) => a.isPrimary)?.roleKey ?? assignedRoles[0]);

  const activeTemplate = await RoleTemplate.findOne({ key: activeRole }).lean();
  const activeAssignmentsForRole = assignments.filter((a) => a.roleKey === activeRole);

  const deptSet = new Set<string>();
  const progSet = new Set<string>();
  const subjSet = new Set<string>();
  const hostelSet = new Set<string>();
  for (const a of activeAssignmentsForRole) {
    a.scope?.departmentIds?.forEach((id) => deptSet.add(String(id)));
    a.scope?.programIds?.forEach((id) => progSet.add(String(id)));
    a.scope?.subjectIds?.forEach((id) => subjSet.add(String(id)));
    a.scope?.hostelIds?.forEach((id) => hostelSet.add(String(id)));
  }

  return {
    userId: String(user._id),
    sessionId,
    email: user.email,
    name: user.name,
    activeRole,
    assignedRoles,
    permissions: activeTemplate?.permissions ?? [],
    linkedStudentId: user.linkedStudentId ? String(user.linkedStudentId) : null,
    linkedEmployeeId: user.linkedEmployeeId ? String(user.linkedEmployeeId) : null,
    mfaVerified,
    scopes: {
      departmentIds: [...deptSet],
      programIds: [...progSet],
      subjectIds: [...subjSet],
      hostelIds: [...hostelSet]
    }
  };
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.header('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    }

    let decoded: AccessTokenPayload;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid or expired access token');
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.sid)) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Malformed session reference');
    }

    const session = await Session.findById(decoded.sid).lean();
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Session has expired or been revoked');
    }

    const auth = await resolveAuthContext(
      decoded.sub,
      decoded.sid,
      session.activeRoleKey || decoded.role,
      Boolean(decoded.mfa)
    );
    (req as AuthenticatedRequest).auth = auth;
    next();
  } catch (err) {
    next(err);
  }
}

export function getPermissionRule(
  auth: AuthContext,
  moduleName: ErpModule,
  verb: PermissionVerb
): ModulePermissionRule | undefined {
  return auth.permissions.find(
    (rule) => rule.module === moduleName && rule.actions.includes(verb)
  );
}

export function requirePermission(moduleName: ErpModule, verb: PermissionVerb) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      next(new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required'));
      return;
    }

    const rule = getPermissionRule(auth, moduleName, verb);
    if (!rule) {
      await recordAuditEvent({
        req,
        action: `Denied ${verb} access on ${moduleName}`,
        category: 'rbac',
        resourceType: moduleName,
        resourceId: Array.isArray(req.params?.id) ? req.params.id[0] : (req.params?.id || 'collection'),
        outcome: 'denied',
        metadata: { verb, activeRole: auth.activeRole }
      });
      next(
        new AppError(
          403,
          ERROR_CODES.FORBIDDEN,
          `Role ${auth.activeRole} is not permitted to ${verb} ${moduleName}`
        )
      );
      return;
    }

    res.locals.permissionScope = rule.scope as AccessScope;
    next();
  };
}

export function assertSelfOrScopedAccess(
  auth: AuthContext,
  scope: AccessScope,
  ownerMatch: boolean,
  departmentId?: string | null
): void {
  if (scope === 'all') return;
  if (scope === 'own' && ownerMatch) return;
  if (scope === 'department' && departmentId && auth.scopes.departmentIds.includes(String(departmentId))) {
    return;
  }
  throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Access outside your assigned organizational scope');
}
