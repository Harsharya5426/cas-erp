import { Router } from 'express';
import { z } from 'zod';
import { ERROR_CODES } from '@cas-erp/shared';
import { recordAuditEvent } from '../../core/audit.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import { type AuthenticatedRequest, requireAuth, requirePermission } from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { Announcement, Notification } from './models.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const notifications = await Notification.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    const unreadCount = notifications.filter((n) => !n.readAt).length;
    sendSuccess(req, res, { notifications, unreadCount });
  })
);

notificationsRouter.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: auth.userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notif) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Notification not found');
    sendSuccess(req, res, { notification: notif });
  })
);

notificationsRouter.get(
  '/announcements',
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const announcements = await Announcement.find({
      $or: [{ targetRole: 'ALL' }, { targetRole: auth.activeRole }]
    })
      .sort({ publishedAt: -1 })
      .limit(50)
      .lean();
    sendSuccess(req, res, { announcements });
  })
);

notificationsRouter.post(
  '/announcements',
  requirePermission('notifications', 'create'),
  validateBody(
    z.object({
      title: z.string().trim().min(3).max(200),
      titleHi: z.string().trim().optional(),
      content: z.string().trim().min(5),
      contentHi: z.string().trim().optional(),
      category: z.string().trim().default('General Circular'),
      priority: z.enum(['Urgent', 'High', 'Normal']).default('Normal'),
      targetRole: z.string().trim().default('ALL'),
      departmentName: z.string().trim().optional(),
      isPublic: z.boolean().default(false)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const code = `ANN-${Date.now().toString().slice(-6)}`;
    const announcement = await Announcement.create({
      ...req.body,
      code,
      authorId: auth.userId,
      authorName: auth.name
    });
    await recordAuditEvent({
      req,
      action: `Published campus circular ${code}: ${announcement.title}`,
      category: 'academic',
      resourceType: 'Announcement',
      resourceId: String(announcement._id)
    });
    sendSuccess(req, res, { announcement }, 201);
  })
);

