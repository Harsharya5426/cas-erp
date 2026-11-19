import { Router } from 'express';
import { z } from 'zod';
import {
  DEFAULT_ROLE_TEMPLATES,
  ERROR_CODES,
  ROLE_KEYS,
  emailSchema,
  paginationQuerySchema,
  passwordSchema
} from '@cas-erp/shared';
import { env } from '../../config/env.js';
import { AuditEvent, recordAuditEvent } from '../../core/audit.js';
import { hashPassword, sha256Hex } from '../../core/crypto.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import {
  type AuthenticatedRequest,
  requireAuth,
  requirePermission,
  signAccessToken
} from '../../core/rbac.js';
import {
  buildPaginationMeta,
  sendSuccess,
  validateBody,
  validateQuery
} from '../../core/requestContext.js';
import { RoleAssignment, RoleTemplate, Session, User } from './models.js';
import {
  assignRoleToUser,
  authenticateUser,
  beginMfaSetup,
  confirmPasswordReset,
  requestPasswordReset,
  rotateRefreshSession,
  verifyAndEnableMfa
} from './service.js';

const REFRESH_COOKIE_NAME = 'cas_refresh_token';

function getRefreshCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    secure: isProd ? true : env.COOKIE_SECURE,
    path: '/api/v1/auth'
  };
}

function setRefreshCookie(res: import('express').Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...getRefreshCookieOptions(),
    maxAge: env.JWT_REFRESH_TTL_DAYS * 86_400_000
  });
}

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  mfaCode: z.string().trim().optional(),
  deviceLabel: z.string().trim().max(100).optional()
});

const preferencesSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  language: z.enum(['en', 'hi']).optional()
});

const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(25).optional(),
  password: passwordSchema,
  roleKey: z.enum(ROLE_KEYS),
  departmentIds: z.array(z.string()).optional(),
  hostelIds: z.array(z.string()).optional()
});

export const authRouter = Router();

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authenticateUser({
      ...req.body,
      req
    });
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(req, res, {
      accessToken: result.accessToken,
      expiresInSeconds: result.expiresInSeconds,
      auth: result.auth,
      user: result.user
    });
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!token) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Refresh token missing');
    }
    const result = await rotateRefreshSession(String(token), req);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(req, res, {
      accessToken: result.accessToken,
      expiresInSeconds: result.expiresInSeconds,
      auth: result.auth,
      user: result.user
    });
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const rawCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    let revokedSessionId: string | null = null;

    if (rawCookie) {
      const session = await Session.findOneAndUpdate(
        { refreshTokenHash: sha256Hex(String(rawCookie)), revokedAt: null },
        { $set: { revokedAt: new Date() } },
        { new: true }
      );
      if (session) revokedSessionId = String(session._id);
    }

    const authHeader = req.headers.authorization;
    if (!revokedSessionId && authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(authHeader.slice(7), env.JWT_ACCESS_SECRET) as { sid?: string };
        if (decoded?.sid) {
          await Session.findByIdAndUpdate(decoded.sid, { $set: { revokedAt: new Date() } });
          revokedSessionId = decoded.sid;
        }
      } catch {
        // Ignore expired/invalid bearer token during logout; cookie is still cleared
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

    if (revokedSessionId) {
      await recordAuditEvent({
        req,
        action: 'User logged out',
        category: 'identity',
        resourceType: 'Session',
        resourceId: revokedSessionId
      });
    }
    sendSuccess(req, res, { loggedOut: true });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const user = await User.findById(auth.userId).lean();
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
    sendSuccess(req, res, {
      auth,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        mfaEnabled: user.mfaEnabled,
        preferences: user.preferences
      }
    });
  })
);

authRouter.patch(
  '/me/preferences',
  requireAuth,
  validateBody(preferencesSchema),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const user = await User.findById(auth.userId);
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');

    user.preferences = { ...user.preferences, ...req.body };
    await user.save();
    sendSuccess(req, res, { preferences: user.preferences });
  })
);

authRouter.post(
  '/switch-role',
  requireAuth,
  validateBody(z.object({ roleKey: z.string().trim().min(2) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const targetRole = String(req.body.roleKey).toUpperCase();
    if (!auth.assignedRoles.includes(targetRole)) {
      await recordAuditEvent({
        req,
        action: `Denied role switch to unassigned role ${targetRole}`,
        category: 'rbac',
        resourceType: 'Session',
        resourceId: auth.sessionId,
        outcome: 'denied'
      });
      throw new AppError(403, ERROR_CODES.FORBIDDEN, `Role ${targetRole} is not assigned to your account`);
    }

    await Session.findByIdAndUpdate(auth.sessionId, { $set: { activeRoleKey: targetRole } });
    const accessToken = signAccessToken({
      sub: auth.userId,
      sid: auth.sessionId,
      role: targetRole,
      mfa: auth.mfaVerified
    });
    await recordAuditEvent({
      req,
      action: `Switched active role from ${auth.activeRole} to ${targetRole}`,
      category: 'rbac',
      resourceType: 'Session',
      resourceId: auth.sessionId
    });
    sendSuccess(req, res, { accessToken, activeRole: targetRole });
  })
);

authRouter.get(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const sessions = await Session.find({
      userId: auth.userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    })
      .select('-refreshTokenHash')
      .sort({ lastUsedAt: -1 })
      .lean();
    sendSuccess(req, res, { sessions, currentSessionId: auth.sessionId });
  })
);

authRouter.delete(
  '/sessions/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const session = await Session.findOne({ _id: req.params.id, userId: auth.userId });
    if (!session) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Session not found');
    session.revokedAt = new Date();
    await session.save();
    await recordAuditEvent({
      req,
      action: 'Revoked active session',
      category: 'identity',
      resourceType: 'Session',
      resourceId: String(session._id)
    });
    sendSuccess(req, res, { revoked: true });
  })
);

authRouter.post(
  '/mfa/setup',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const setup = await beginMfaSetup(auth.userId);
    sendSuccess(req, res, setup);
  })
);

authRouter.post(
  '/mfa/enable',
  requireAuth,
  validateBody(z.object({ code: z.string().regex(/^\d{6}$/) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    await verifyAndEnableMfa(auth.userId, req.body.code, req);
    sendSuccess(req, res, { mfaEnabled: true });
  })
);

authRouter.post(
  '/mfa/disable',
  requireAuth,
  validateBody(z.object({ password: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const user = await User.findById(auth.userId);
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
    const { verifyPassword } = await import('../../core/crypto.js');
    const valid = await verifyPassword(req.body.password, user.passwordHash);
    if (!valid) throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid password');
    user.mfaEnabled = false;
    user.mfaSecretEncrypted = undefined;
    user.mfaRecoveryCodeHashes = [];
    await user.save();
    await recordAuditEvent({
      req,
      action: 'Disabled TOTP Multi-Factor Authentication',
      category: 'identity',
      resourceType: 'User',
      resourceId: auth.userId
    });
    sendSuccess(req, res, { mfaEnabled: false });
  })
);

authRouter.post(
  '/password/forgot',
  validateBody(z.object({ email: emailSchema })),
  asyncHandler(async (req, res) => {
    const result = await requestPasswordReset(req.body.email, req);
    sendSuccess(req, res, result);
  })
);

authRouter.post(
  '/password/reset',
  validateBody(z.object({ token: z.string().min(10), newPassword: passwordSchema })),
  asyncHandler(async (req, res) => {
    await confirmPasswordReset(req.body.token, req.body.newPassword, req);
    sendSuccess(req, res, { reset: true });
  })
);

authRouter.post(
  '/sso/:provider',
  asyncHandler(async (req, _res) => {
    const provider = String(req.params.provider).toLowerCase();
    if (provider === 'google' && !env.GOOGLE_SSO_ENABLED) {
      throw new AppError(
        503,
        ERROR_CODES.INTEGRATION_NOT_CONFIGURED,
        'Google Workspace SSO is not enabled for this institutional tenant.'
      );
    }
    if (provider === 'microsoft' && !env.MICROSOFT_SSO_ENABLED) {
      throw new AppError(
        503,
        ERROR_CODES.INTEGRATION_NOT_CONFIGURED,
        'Microsoft Entra SSO is not enabled for this institutional tenant.'
      );
    }
    throw new AppError(
      501,
      ERROR_CODES.INTEGRATION_NOT_CONFIGURED,
      'SSO tenant client credentials must be configured in AWS Secrets Manager before callback verification.'
    );
  })
);

// ============================================================================
// RBAC & Audit Administration Routes
// ============================================================================
export const rbacRouter = Router();

rbacRouter.use(requireAuth);

rbacRouter.get(
  '/roles',
  requirePermission('rbac', 'view'),
  asyncHandler(async (req, res) => {
    const templates = await RoleTemplate.find().sort({ key: 1 }).lean();
    sendSuccess(req, res, { roles: templates.length ? templates : DEFAULT_ROLE_TEMPLATES });
  })
);

rbacRouter.patch(
  '/roles/:key',
  requirePermission('rbac', 'configure'),
  validateBody(
    z.object({
      name: z.string().trim().min(2).optional(),
      nameHi: z.string().trim().min(2).optional(),
      description: z.string().trim().optional(),
      permissions: z
        .array(
          z.object({
            module: z.string(),
            actions: z.array(z.string()),
            scope: z.enum(['all', 'department', 'assigned', 'own', 'linked-student', 'hostel', 'pool-assigned'])
          })
        )
        .optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const roleKey = String(req.params.key).toUpperCase();
    const updated = await RoleTemplate.findOneAndUpdate(
      { key: roleKey },
      { $set: req.body },
      { new: true }
    );
    if (!updated) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Role template not found');
    await recordAuditEvent({
      req,
      action: `Updated configurable permissions for role ${roleKey}`,
      category: 'rbac',
      resourceType: 'RoleTemplate',
      resourceId: roleKey
    });
    sendSuccess(req, res, { role: updated });
  })
);

rbacRouter.get(
  '/users',
  requirePermission('identity', 'view'),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, search } = res.locals.query as z.infer<typeof paginationQuerySchema>;
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -mfaSecretEncrypted -mfaRecoveryCodeHashes')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const userIds = users.map((u) => u._id);
    const assignments = await RoleAssignment.find({ userId: { $in: userIds }, active: true }).lean();
    const merged = users.map((u) => ({
      ...u,
      roles: assignments.filter((a) => String(a.userId) === String(u._id))
    }));

    sendSuccess(req, res, { users: merged }, 200, buildPaginationMeta(page, limit, total));
  })
);

rbacRouter.post(
  '/users',
  requirePermission('identity', 'manage-users'),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const passwordHash = await hashPassword(req.body.password);
    const user = await User.create({
      email: req.body.email,
      name: req.body.name,
      phone: req.body.phone,
      passwordHash,
      status: 'active'
    });
    const assignment = await assignRoleToUser({
      userId: String(user._id),
      roleKey: req.body.roleKey,
      departmentIds: req.body.departmentIds,
      hostelIds: req.body.hostelIds,
      isPrimary: true,
      delegatedByUserId: auth.userId
    });
    await recordAuditEvent({
      req,
      action: `Provisioned user ${user.email} with role ${req.body.roleKey}`,
      category: 'identity',
      resourceType: 'User',
      resourceId: String(user._id)
    });
    sendSuccess(
      req,
      res,
      {
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          status: user.status
        },
        assignment
      },
      201
    );
  })
);

rbacRouter.post(
  '/users/:id/roles',
  requirePermission('rbac', 'manage-users'),
  validateBody(
    z.object({
      roleKey: z.enum(ROLE_KEYS),
      departmentIds: z.array(z.string()).optional(),
      hostelIds: z.array(z.string()).optional(),
      isPrimary: z.boolean().optional(),
      validUntil: z.string().datetime().nullable().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const assignment = await assignRoleToUser({
      userId: String(req.params.id),
      roleKey: req.body.roleKey,
      departmentIds: req.body.departmentIds,
      hostelIds: req.body.hostelIds,
      isPrimary: req.body.isPrimary,
      validUntil: req.body.validUntil,
      delegatedByUserId: auth.userId
    });
    await recordAuditEvent({
      req,
      action: `Assigned role ${req.body.roleKey} to user ${req.params.id}`,
      category: 'rbac',
      resourceType: 'RoleAssignment',
      resourceId: String(assignment._id)
    });
    sendSuccess(req, res, { assignment }, 201);
  })
);

rbacRouter.patch(
  '/users/:id/status',
  requirePermission('identity', 'manage-users'),
  validateBody(z.object({ status: z.enum(['active', 'suspended', 'dormant']) })),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true }
    ).select('-passwordHash -mfaSecretEncrypted -mfaRecoveryCodeHashes');
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');

    if (req.body.status !== 'active') {
      await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    }
    await recordAuditEvent({
      req,
      action: `Changed account status to ${req.body.status} for ${user.email}`,
      category: 'identity',
      resourceType: 'User',
      resourceId: String(user._id)
    });
    sendSuccess(req, res, { user });
  })
);

rbacRouter.get(
  '/audit-events',
  requirePermission('audit', 'view'),
  validateQuery(
    paginationQuerySchema.extend({
      category: z.string().optional(),
      outcome: z.enum(['success', 'denied', 'failure']).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const { page, limit, search, category, outcome } = res.locals.query as {
      page: number;
      limit: number;
      search?: string;
      category?: string;
      outcome?: string;
    };
    const filter: Record<string, unknown> = {};
    if (category && category !== 'ALL') filter.category = category;
    if (outcome) filter.outcome = outcome;
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { actorName: { $regex: search, $options: 'i' } },
        { actorEmail: { $regex: search, $options: 'i' } },
        { resourceType: { $regex: search, $options: 'i' } }
      ];
    }

    const [events, total] = await Promise.all([
      AuditEvent.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditEvent.countDocuments(filter)
    ]);

    sendSuccess(req, res, { events }, 200, buildPaginationMeta(page, limit, total));
  })
);
