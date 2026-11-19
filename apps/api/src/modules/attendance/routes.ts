import { Router } from 'express';
import { z } from 'zod';
import {
  ATTENDANCE_CAPTURE_METHODS,
  ATTENDANCE_STATUSES,
  ERROR_CODES
} from '@cas-erp/shared';
import { env } from '../../config/env.js';
import { recordAuditEvent } from '../../core/audit.js';
import { generateOpaqueToken, sha256Hex } from '../../core/crypto.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import {
  type AuthenticatedRequest,
  requireAuth,
  requirePermission
} from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { Employee, GuardianLink, Student } from '../academics/models.js';
import { InstitutionSettings } from '../org/models.js';
import { AttendanceEvent, BiometricConsent, FaceProfile, QrAttendanceSession } from './models.js';

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (!norm) return vec;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

export const attendanceRouter = Router();
attendanceRouter.use(requireAuth);

async function recalculateStudentAttendancePct(studentId: string) {
  const events = await AttendanceEvent.find({ personType: 'student', personId: studentId }).lean();
  if (events.length === 0) return;
  const attended = events.filter((e) => e.status === 'Present' || e.status === 'Late' || e.status === 'Excused').length;
  const pct = Math.round((attended / events.length) * 100);
  await Student.findByIdAndUpdate(studentId, { $set: { attendancePct: pct } });
}

attendanceRouter.get(
  '/events',
  requirePermission('attendance', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const { subjectCode, sessionDate, personType } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};
    if (subjectCode) filter.subjectCode = subjectCode.toUpperCase();
    if (sessionDate) filter.sessionDate = sessionDate;
    if (personType) filter.personType = personType;

    if (scope === 'own' && auth.linkedStudentId) {
      filter.personId = auth.linkedStudentId;
    } else if (scope === 'linked-student') {
      const links = await GuardianLink.find({
        guardianUserId: auth.userId,
        verificationStatus: 'verified',
        allowAttendanceView: true
      }).lean();
      filter.personId = { $in: links.map((l) => l.studentId) };
    } else if (scope === 'department' && auth.scopes.departmentIds.length > 0) {
      filter.departmentId = { $in: auth.scopes.departmentIds };
    }

    const events = await AttendanceEvent.find(filter).sort({ sessionDate: -1, createdAt: -1 }).limit(200).lean();
    sendSuccess(req, res, { events });
  })
);

attendanceRouter.post(
  '/lectures/mark',
  requirePermission('attendance', 'create'),
  validateBody(
    z.object({
      subjectCode: z.string().trim().min(2),
      sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      lectureSlot: z.string().trim().default('SLOT-1'),
      captureMethod: z.enum(ATTENDANCE_CAPTURE_METHODS).default('manual'),
      entries: z
        .array(
          z.object({
            studentId: z.string().min(10),
            status: z.enum(ATTENDANCE_STATUSES)
          })
        )
        .min(1)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const { subjectCode, sessionDate, lectureSlot, captureMethod, entries } = req.body;

    if (captureMethod === 'face_advisory') {
      const settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
      if (!settings?.biometrics?.faceMatchingEnabled || !env.BIOMETRIC_POLICY_APPROVED) {
        throw new AppError(
          403,
          ERROR_CODES.POLICY_GATE_BLOCKED,
          'Face-matching capture is disabled by institutional privacy policy. Use Manual, QR, or RFID attendance.'
        );
      }
    }

    const saved = [];
    for (const item of entries) {
      const student = await Student.findById(item.studentId).lean();
      if (!student) continue;
      const idempotencyKey = `STU:${student._id}:${subjectCode.toUpperCase()}:${sessionDate}:${lectureSlot}`;
      const doc = await AttendanceEvent.findOneAndUpdate(
        { idempotencyKey },
        {
          $set: {
            personType: 'student',
            personId: student._id,
            personCode: student.rollNumber,
            personName: student.name,
            departmentId: student.departmentId,
            subjectCode: subjectCode.toUpperCase(),
            sessionDate,
            lectureSlot,
            status: item.status,
            captureMethod,
            markedByUserId: auth.userId
          }
        },
        { upsert: true, new: true }
      );
      saved.push(doc);
      await recalculateStudentAttendancePct(String(student._id));
    }

    await recordAuditEvent({
      req,
      action: `Recorded lecture attendance for ${subjectCode.toUpperCase()} on ${sessionDate} (${saved.length} students via ${captureMethod})`,
      category: 'attendance',
      resourceType: 'AttendanceEvent',
      resourceId: `${subjectCode.toUpperCase()}:${sessionDate}`
    });

    sendSuccess(req, res, { count: saved.length, events: saved }, 201);
  })
);

// QR Session Check-in (Non-Biometric Alternative)
attendanceRouter.post(
  '/qr-sessions',
  requirePermission('attendance', 'create'),
  validateBody(
    z.object({
      subjectCode: z.string().trim().min(2),
      sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      lectureSlot: z.string().trim().default('SLOT-1'),
      ttlMinutes: z.number().int().min(1).max(120).default(15)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const codeToken = `CASQR-${generateOpaqueToken(6).toUpperCase()}`;
    const session = await QrAttendanceSession.create({
      subjectCode: req.body.subjectCode.toUpperCase(),
      sessionDate: req.body.sessionDate,
      lectureSlot: req.body.lectureSlot,
      codeToken,
      createdByUserId: auth.userId,
      expiresAt: new Date(Date.now() + req.body.ttlMinutes * 60_000)
    });
    sendSuccess(req, res, { session }, 201);
  })
);

attendanceRouter.post(
  '/qr-checkin',
  requirePermission('attendance', 'submit'),
  validateBody(z.object({ codeToken: z.string().trim().min(4) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const session = await QrAttendanceSession.findOne({
      codeToken: req.body.codeToken.toUpperCase(),
      active: true,
      expiresAt: { $gt: new Date() }
    });
    if (!session) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'QR attendance session expired or invalid');
    }
    const student = auth.linkedStudentId
      ? await Student.findById(auth.linkedStudentId).lean()
      : await Student.findOne({ userId: auth.userId }).lean();
    if (!student) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Authenticated account is not linked to a student record');
    }

    const idempotencyKey = `STU:${student._id}:${session.subjectCode}:${session.sessionDate}:${session.lectureSlot}`;
    const existing = await AttendanceEvent.findOne({ idempotencyKey }).lean();
    if (existing) {
      sendSuccess(req, res, { event: existing, duplicateIgnored: true });
      return;
    }

    const event = await AttendanceEvent.create({
      personType: 'student',
      personId: student._id,
      personCode: student.rollNumber,
      personName: student.name,
      departmentId: student.departmentId,
      subjectCode: session.subjectCode,
      sessionDate: session.sessionDate,
      lectureSlot: session.lectureSlot,
      status: 'Present',
      captureMethod: 'qr',
      idempotencyKey,
      markedByUserId: auth.userId
    });
    await recalculateStudentAttendancePct(String(student._id));

    sendSuccess(req, res, { event, duplicateIgnored: false }, 201);
  })
);

// Correction Request & Approval (PRD 04)
attendanceRouter.post(
  '/events/:id/correction',
  requirePermission('attendance', 'submit'),
  validateBody(
    z.object({
      requestedStatus: z.enum(ATTENDANCE_STATUSES),
      reason: z.string().trim().min(5)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const event = await AttendanceEvent.findById(req.params.id);
    if (!event) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Attendance event not found');

    event.correctionRequest = {
      requestedStatus: req.body.requestedStatus,
      reason: req.body.reason,
      status: 'pending',
      requestedByUserId: auth.userId as never
    };
    await event.save();

    await recordAuditEvent({
      req,
      action: `Submitted attendance correction request (${event.status} -> ${req.body.requestedStatus})`,
      category: 'attendance',
      resourceType: 'AttendanceEvent',
      resourceId: String(event._id)
    });

    sendSuccess(req, res, { event });
  })
);

attendanceRouter.post(
  '/events/:id/correction/decision',
  requirePermission('attendance', 'approve'),
  validateBody(
    z.object({
      decision: z.enum(['approved', 'rejected']),
      remarks: z.string().trim().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const event = await AttendanceEvent.findById(req.params.id);
    if (!event || event.correctionRequest?.status !== 'pending') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'No pending correction request found');
    }

    if (req.body.decision === 'approved' && event.correctionRequest.requestedStatus) {
      event.status = event.correctionRequest.requestedStatus;
    }
    event.correctionRequest.status = req.body.decision;
    event.correctionRequest.reviewedByUserId = auth.userId as never;
    event.correctionRequest.reviewedAt = new Date();
    event.correctionRequest.remarks = req.body.remarks || '';
    await event.save();

    if (event.personType === 'student') {
      await recalculateStudentAttendancePct(String(event.personId));
    }

    await recordAuditEvent({
      req,
      action: `${req.body.decision.toUpperCase()} attendance correction for ${event.personCode}`,
      category: 'attendance',
      resourceType: 'AttendanceEvent',
      resourceId: String(event._id)
    });

    sendSuccess(req, res, { event });
  })
);

attendanceRouter.get(
  '/defaulters',
  requirePermission('attendance', 'view'),
  asyncHandler(async (req, res) => {
    const settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
    const threshold = Number(req.query.threshold ?? settings?.attendanceShortageThresholdPct ?? 75);
    const defaulters = await Student.find({ attendancePct: { $lt: threshold }, status: 'Active' })
      .populate('departmentId', 'code name')
      .sort({ attendancePct: 1 })
      .lean();
    sendSuccess(req, res, { threshold, defaulters });
  })
);

// Employee Punch Check-in / Check-out (FM-05)
attendanceRouter.post(
  '/employee/punch',
  requirePermission('attendance', 'submit'),
  validateBody(
    z.object({
      employeeId: z.string().min(10),
      punchType: z.enum(['in', 'out']),
      sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      captureMethod: z.enum(['manual', 'qr', 'rfid', 'device']).default('manual')
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const emp = await Employee.findById(req.body.employeeId).lean();
    if (!emp) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Employee not found');

    const idempotencyKey = `EMP:${emp._id}:${req.body.sessionDate}`;
    let event = await AttendanceEvent.findOne({ idempotencyKey });
    const now = new Date();

    if (!event) {
      event = await AttendanceEvent.create({
        personType: 'employee',
        personId: emp._id,
        personCode: emp.employeeCode,
        personName: emp.name,
        departmentId: emp.departmentId,
        sessionDate: req.body.sessionDate,
        lectureSlot: 'SHIFT',
        status: 'Present',
        captureMethod: req.body.captureMethod,
        idempotencyKey,
        markedByUserId: auth.userId,
        checkInAt: now
      });
    } else if (req.body.punchType === 'out') {
      event.checkOutAt = now;
      if (event.checkInAt) {
        const hrs = Math.max(0, (now.getTime() - event.checkInAt.getTime()) / 3_600_000);
        event.workingHours = Number(hrs.toFixed(2));
        event.overtimeHours = Number(Math.max(0, hrs - 8).toFixed(2));
      }
      await event.save();
    }

    sendSuccess(req, res, { event }, 201);
  })
);

// Biometric Consent & Governance Status (PRD 04)
attendanceRouter.get(
  '/biometric-policy',
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
    const consent = await BiometricConsent.findOne({ userId: auth.userId }).lean();
    sendSuccess(req, res, {
      policy: {
        envPolicyApproved: env.BIOMETRIC_POLICY_APPROVED,
        privacyAssessmentApproved: settings?.biometrics?.privacyAssessmentApproved ?? false,
        faceMatchingEnabled:
          (Boolean(settings?.biometrics?.faceMatchingEnabled) && env.BIOMETRIC_POLICY_APPROVED) ||
          env.NODE_ENV === 'development',
        settingsFaceEnabled: Boolean(settings?.biometrics?.faceMatchingEnabled),
        nonBiometricAlternativeRequired: true,
        retentionDays: settings?.biometrics?.retentionDays ?? 365
      },
      userConsent: consent
    });
  })
);

attendanceRouter.patch(
  '/biometric-policy',
  requirePermission('settings', 'configure'),
  validateBody(
    z.object({
      faceMatchingEnabled: z.boolean().optional(),
      privacyAssessmentApproved: z.boolean().optional(),
      retentionDays: z.number().int().min(30).max(1825).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const update: Record<string, unknown> = {};
    if (typeof req.body.faceMatchingEnabled === 'boolean') {
      update['biometrics.faceMatchingEnabled'] = req.body.faceMatchingEnabled;
    }
    if (typeof req.body.privacyAssessmentApproved === 'boolean') {
      update['biometrics.privacyAssessmentApproved'] = req.body.privacyAssessmentApproved;
    }
    if (typeof req.body.retentionDays === 'number') {
      update['biometrics.retentionDays'] = req.body.retentionDays;
    }

    const settings = await InstitutionSettings.findOneAndUpdate(
      { singletonKey: 'CAS_PRIMARY' },
      { $set: update },
      { new: true, upsert: true }
    ).lean();

    await recordAuditEvent({
      req,
      action: `Updated biometric policy settings (faceMatchingEnabled=${settings?.biometrics?.faceMatchingEnabled})`,
      category: 'attendance',
      resourceType: 'InstitutionSettings',
      resourceId: 'CAS_PRIMARY'
    });

    sendSuccess(req, res, { biometrics: settings?.biometrics });
  })
);

// ============================================================================
// Face Recognition Enrollment & Attendance Marking Routes
// ============================================================================
const descriptorSchema = z.array(z.number().finite()).min(32).max(512);

attendanceRouter.get(
  '/face/profiles',
  requirePermission('attendance', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter: Record<string, unknown> = { active: true };
    if (scope === 'own' && auth.linkedStudentId) {
      filter.personId = auth.linkedStudentId;
    } else if (scope === 'department' && auth.scopes.departmentIds.length > 0) {
      filter.departmentId = { $in: auth.scopes.departmentIds };
    }

    const profiles = await FaceProfile.find(filter)
      .select('-descriptor')
      .sort({ updatedAt: -1 })
      .lean();
    sendSuccess(req, res, { profiles, count: profiles.length });
  })
);

attendanceRouter.post(
  '/face/enroll',
  requireAuth,
  validateBody(
    z.object({
      studentId: z.string().min(10).optional(),
      descriptor: descriptorSchema,
      sampleCount: z.number().int().min(1).max(10).default(1),
      consentGiven: z.boolean().refine((v) => v === true, 'Explicit consent is required to enroll face template')
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const canCreateAttendance = auth.permissions.some(
      (p) => p.module === 'attendance' && (p.actions.includes('create') || p.actions.includes('submit'))
    );
    if (!canCreateAttendance) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Not permitted to enroll face templates');
    }

    const targetStudentId = req.body.studentId || auth.linkedStudentId;
    if (!targetStudentId) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Please select a student to enroll.');
    }

    const canManageOthers = auth.permissions.some(
      (p) => p.module === 'attendance' && p.actions.includes('create')
    );
    if (!canManageOthers && String(targetStudentId) !== String(auth.linkedStudentId)) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Students may only enroll their own face template.');
    }

    const student = await Student.findById(targetStudentId).lean();
    if (!student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student not found');

    const normalized = l2Normalize(req.body.descriptor);
    const descriptorHash = sha256Hex(normalized.join(','));

    const profile = await FaceProfile.findOneAndUpdate(
      { personId: student._id },
      {
        $set: {
          personType: 'student',
          personId: student._id,
          personCode: student.rollNumber,
          personName: student.name,
          departmentId: student.departmentId,
          descriptor: normalized,
          descriptorHash,
          sampleCount: req.body.sampleCount,
          consentRecorded: true,
          enrolledByUserId: auth.userId,
          active: true
        }
      },
      { upsert: true, new: true }
    )
      .select('-descriptor')
      .lean();

    if (student.userId) {
      await BiometricConsent.findOneAndUpdate(
        { userId: student.userId },
        {
          $set: {
            consentGiven: true,
            alternativeMethodSelected: 'qr',
            consentNoticeVersion: 'v1.0',
            templateHashOnly: descriptorHash,
            revokedAt: null
          }
        },
        { upsert: true }
      );
    }

    await recordAuditEvent({
      req,
      action: `Enrolled face recognition template for ${student.name} (${student.rollNumber})`,
      category: 'attendance',
      resourceType: 'FaceProfile',
      resourceId: String(profile?._id || student._id)
    });

    sendSuccess(req, res, { profile }, 201);
  })
);

attendanceRouter.delete(
  '/face/profiles/:personId',
  requirePermission('attendance', 'create'),
  asyncHandler(async (req, res) => {
    const deleted = await FaceProfile.findOneAndDelete({ personId: req.params.personId }).lean();
    if (!deleted) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Enrolled face profile not found');

    await recordAuditEvent({
      req,
      action: `Revoked & deleted face template for ${deleted.personName} (${deleted.personCode})`,
      category: 'attendance',
      resourceType: 'FaceProfile',
      resourceId: String(deleted._id)
    });

    sendSuccess(req, res, { deleted: true, personCode: deleted.personCode });
  })
);

attendanceRouter.post(
  '/face/recognize-and-mark',
  requireAuth,
  validateBody(
    z.object({
      descriptor: descriptorSchema,
      subjectCode: z.string().trim().min(2),
      sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      lectureSlot: z.string().trim().default('SLOT-1'),
      threshold: z.number().min(0.6).max(0.99).default(0.84),
      status: z.enum(ATTENDANCE_STATUSES).default('Present')
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const canMark = auth.permissions.some(
      (p) => p.module === 'attendance' && (p.actions.includes('create') || p.actions.includes('submit'))
    );
    if (!canMark) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Not permitted to mark face recognition attendance');
    }

    const settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
    const policyAllowsFace =
      (Boolean(settings?.biometrics?.faceMatchingEnabled) && env.BIOMETRIC_POLICY_APPROVED) ||
      env.NODE_ENV === 'development';
    if (!policyAllowsFace) {
      throw new AppError(
        403,
        ERROR_CODES.POLICY_GATE_BLOCKED,
        'Face recognition marking is disabled by institutional privacy policy. Use QR, RFID, or Manual attendance.'
      );
    }

    const probe = l2Normalize(req.body.descriptor);
    const canMarkAny = auth.permissions.some(
      (p) => p.module === 'attendance' && p.actions.includes('create')
    );

    const profileFilter: Record<string, unknown> = { active: true, consentRecorded: true };
    if (!canMarkAny && auth.linkedStudentId) {
      profileFilter.personId = auth.linkedStudentId;
    }

    const profiles = await FaceProfile.find(profileFilter).lean();
    if (profiles.length === 0) {
      sendSuccess(req, res, {
        matched: false,
        bestConfidencePct: 0,
        message: 'No enrolled face templates found. Please enroll a student face first in the Enroll tab.'
      });
      return;
    }

    const scored = profiles
      .map((p) => ({
        profile: p,
        score: cosineSimilarity(probe, p.descriptor || [])
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const confidencePct = Math.round(Math.max(0, Math.min(1, best.score)) * 1000) / 10;

    if (best.score < req.body.threshold) {
      sendSuccess(req, res, {
        matched: false,
        bestConfidencePct: confidencePct,
        thresholdPct: Math.round(req.body.threshold * 100),
        candidates: scored.slice(0, 3).map((s) => ({
          personCode: s.profile.personCode,
          personName: s.profile.personName,
          confidencePct: Math.round(Math.max(0, Math.min(1, s.score)) * 1000) / 10
        })),
        message: `Face did not meet the ${Math.round(req.body.threshold * 100)}% recognition threshold (best match: ${confidencePct}%). Align face in good lighting or use QR/Manual fallback.`
      });
      return;
    }

    const student = await Student.findById(best.profile.personId).lean();
    if (!student) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Matched student record not found');
    }

    const subjectCode = req.body.subjectCode.toUpperCase();
    const idempotencyKey = `STU:${student._id}:${subjectCode}:${req.body.sessionDate}:${req.body.lectureSlot}`;
    const existing = await AttendanceEvent.findOne({ idempotencyKey }).lean();

    if (existing) {
      sendSuccess(req, res, {
        matched: true,
        alreadyMarked: true,
        confidencePct,
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          deptCode: student.deptCode,
          attendancePct: student.attendancePct
        },
        event: existing
      });
      return;
    }

    const event = await AttendanceEvent.create({
      personType: 'student',
      personId: student._id,
      personCode: student.rollNumber,
      personName: student.name,
      departmentId: student.departmentId,
      subjectCode,
      sessionDate: req.body.sessionDate,
      lectureSlot: req.body.lectureSlot,
      status: req.body.status,
      captureMethod: 'face_advisory',
      idempotencyKey,
      markedByUserId: auth.userId,
      checkInAt: new Date()
    });

    await recalculateStudentAttendancePct(String(student._id));
    const updatedStudent = await Student.findById(student._id).lean();

    await recordAuditEvent({
      req,
      action: `Marked ${req.body.status} via Face Recognition (${confidencePct}% match) for ${student.name} (${student.rollNumber}) in ${subjectCode}`,
      category: 'attendance',
      resourceType: 'AttendanceEvent',
      resourceId: String(event._id),
      metadata: { confidencePct, subjectCode, lectureSlot: req.body.lectureSlot }
    });

    sendSuccess(
      req,
      res,
      {
        matched: true,
        alreadyMarked: false,
        confidencePct,
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          deptCode: student.deptCode,
          attendancePct: updatedStudent?.attendancePct ?? student.attendancePct
        },
        event
      },
      201
    );
  })
);

attendanceRouter.post(
  '/biometric-consent',
  validateBody(
    z.object({
      consentGiven: z.boolean(),
      alternativeMethodSelected: z.enum(['manual', 'qr', 'rfid']).default('qr'),
      templateToken: z.string().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
    const consent = await BiometricConsent.findOneAndUpdate(
      { userId: auth.userId },
      {
        $set: {
          consentGiven: req.body.consentGiven,
          alternativeMethodSelected: req.body.alternativeMethodSelected,
          consentNoticeVersion: settings?.biometrics?.consentNoticeVersion || 'v1.0',
          templateHashOnly: req.body.consentGiven && req.body.templateToken ? sha256Hex(req.body.templateToken) : '',
          revokedAt: req.body.consentGiven ? null : new Date()
        }
      },
      { upsert: true, new: true }
    );
    await recordAuditEvent({
      req,
      action: `Updated biometric consent (${req.body.consentGiven ? 'opted-in' : 'non-biometric alternative'})`,
      category: 'attendance',
      resourceType: 'BiometricConsent',
      resourceId: String(consent._id)
    });
    sendSuccess(req, res, { consent });
  })
);

