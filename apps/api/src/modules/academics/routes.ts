import { Router } from 'express';
import { z } from 'zod';
import { ERROR_CODES, paginationQuerySchema } from '@cas-erp/shared';
import { recordAuditEvent } from '../../core/audit.js';
import { hashPassword } from '../../core/crypto.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import {
  type AuthenticatedRequest,
  requireAuth,
  requirePermission
} from '../../core/rbac.js';
import {
  buildPaginationMeta,
  sendSuccess,
  validateBody,
  validateQuery
} from '../../core/requestContext.js';
import { RoleAssignment, User } from '../identity/models.js';
import { Department } from '../org/models.js';
import { Employee, GuardianLink, Student, TimetableSlot } from './models.js';

export const academicsRouter = Router();
academicsRouter.use(requireAuth);

// ============================================================================
// Students & Parent Guardian Links
// ============================================================================
academicsRouter.get(
  '/students',
  requirePermission('students', 'view'),
  validateQuery(paginationQuerySchema.extend({ deptCode: z.string().optional(), status: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const { page, limit, search, deptCode, status } = res.locals.query as {
      page: number;
      limit: number;
      search?: string;
      deptCode?: string;
      status?: string;
    };

    const filter: Record<string, unknown> = {};
    if (scope === 'own') {
      if (auth.linkedStudentId) filter._id = auth.linkedStudentId;
      else filter.userId = auth.userId;
    } else if (scope === 'linked-student') {
      const links = await GuardianLink.find({
        guardianUserId: auth.userId,
        verificationStatus: 'verified'
      }).lean();
      filter._id = { $in: links.map((l) => l.studentId) };
    } else if (scope === 'department' && auth.scopes.departmentIds.length > 0) {
      filter.departmentId = { $in: auth.scopes.departmentIds };
    }

    if (deptCode && deptCode !== 'ALL') filter.deptCode = deptCode.toUpperCase();
    if (status && status !== 'ALL') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('departmentId', 'code name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter)
    ]);

    sendSuccess(req, res, { students }, 200, buildPaginationMeta(page, limit, total));
  })
);

academicsRouter.post(
  '/students',
  requirePermission('students', 'create'),
  validateBody(
    z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().email(),
      phone: z.string().trim().optional(),
      rollNumber: z.string().trim().min(3).max(30),
      deptCode: z.string().trim().min(2),
      programCode: z.string().trim().default('BTECH'),
      semesterNumber: z.number().int().min(1).max(12).default(1),
      batch: z.string().trim().default('2026 - 2030'),
      section: z.string().trim().default('A'),
      totalFeeAssessedInr: z.number().min(0).default(0),
      guardianName: z.string().trim().optional(),
      guardianPhone: z.string().trim().optional(),
      enrolledSubjectCodes: z.array(z.string()).default([])
    })
  ),
  asyncHandler(async (req, res) => {
    const dept = await Department.findOne({ code: req.body.deptCode.toUpperCase() }).lean();
    if (!dept) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Department not found');

    const count = await Student.countDocuments();
    const studentCode = `STU-2026-${String(count + 1).padStart(4, '0')}`;

    const student = await Student.create({
      studentCode,
      rollNumber: req.body.rollNumber.toUpperCase(),
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone || '',
      departmentId: dept._id,
      deptCode: dept.code,
      programCode: req.body.programCode.toUpperCase(),
      semesterNumber: req.body.semesterNumber,
      batch: req.body.batch,
      section: req.body.section,
      enrolledSubjectCodes: req.body.enrolledSubjectCodes,
      guardianSummary: {
        name: req.body.guardianName || '',
        relation: 'Parent',
        phone: req.body.guardianPhone || ''
      },
      totalFeeAssessedInr: req.body.totalFeeAssessedInr,
      paidFeeInr: 0,
      dueFeeInr: req.body.totalFeeAssessedInr,
      feeStatus: req.body.totalFeeAssessedInr > 0 ? 'Pending' : 'Paid'
    });

    await recordAuditEvent({
      req,
      action: `Enrolled student ${student.name} (${student.rollNumber})`,
      category: 'academic',
      resourceType: 'Student',
      resourceId: String(student._id)
    });

    sendSuccess(req, res, { student }, 201);
  })
);

academicsRouter.patch(
  '/students/:id',
  requirePermission('students', 'edit'),
  validateBody(
    z.object({
      phone: z.string().trim().optional(),
      semesterNumber: z.number().int().min(1).max(12).optional(),
      section: z.string().trim().optional(),
      status: z.enum(['Active', 'Graduating', 'Alumni', 'Suspended', 'Withdrawn']).optional(),
      enrolledSubjectCodes: z.array(z.string()).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const student = await Student.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student not found');
    await recordAuditEvent({
      req,
      action: `Updated student dossier ${student.rollNumber}`,
      category: 'academic',
      resourceType: 'Student',
      resourceId: String(student._id)
    });
    sendSuccess(req, res, { student });
  })
);

// Verified Guardian Links (Parent Portal Governance - PRD 02 & 08)
academicsRouter.get(
  '/guardian-links',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const filter =
      auth.activeRole === 'PARENT' ? { guardianUserId: auth.userId } : {};
    const links = await GuardianLink.find(filter)
      .populate('guardianUserId', 'name email phone')
      .populate('studentId', 'name rollNumber deptCode semesterNumber attendancePct dueFeeInr')
      .sort({ createdAt: -1 })
      .lean();
    sendSuccess(req, res, { links });
  })
);

academicsRouter.post(
  '/guardian-links',
  requirePermission('students', 'edit'),
  validateBody(
    z.object({
      guardianEmail: z.string().email(),
      guardianName: z.string().trim().min(2),
      guardianPhone: z.string().trim().optional(),
      studentId: z.string().min(10),
      relationship: z.enum(['Father', 'Mother', 'LegalGuardian']),
      tempPassword: z.string().min(8).default('ParentPass#2026')
    })
  ),
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.body.studentId);
    if (!student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student not found');

    let guardianUser = await User.findOne({ email: req.body.guardianEmail.toLowerCase() });
    if (!guardianUser) {
      guardianUser = await User.create({
        email: req.body.guardianEmail.toLowerCase(),
        name: req.body.guardianName,
        phone: req.body.guardianPhone || '',
        passwordHash: await hashPassword(req.body.tempPassword),
        status: 'active'
      });
      await RoleAssignment.create({
        userId: guardianUser._id,
        roleKey: 'PARENT',
        isPrimary: true,
        active: true
      });
    }

    const link = await GuardianLink.create({
      guardianUserId: guardianUser._id,
      studentId: student._id,
      relationship: req.body.relationship,
      verificationStatus: 'pending'
    });

    await recordAuditEvent({
      req,
      action: `Created pending guardian link for student ${student.rollNumber}`,
      category: 'identity',
      resourceType: 'GuardianLink',
      resourceId: String(link._id)
    });

    sendSuccess(req, res, { link }, 201);
  })
);

academicsRouter.post(
  '/guardian-links/:id/decision',
  requirePermission('students', 'edit'),
  validateBody(z.object({ decision: z.enum(['verified', 'revoked']) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const link = await GuardianLink.findById(req.params.id);
    if (!link) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Guardian link not found');

    link.verificationStatus = req.body.decision;
    if (req.body.decision === 'verified') {
      link.verifiedByUserId = auth.userId as never;
      link.verifiedAt = new Date();
      link.revokedAt = null;
    } else {
      link.revokedAt = new Date();
    }
    await link.save();

    await recordAuditEvent({
      req,
      action: `${req.body.decision === 'verified' ? 'Verified' : 'Revoked'} guardian relationship ${link._id}`,
      category: 'identity',
      resourceType: 'GuardianLink',
      resourceId: String(link._id)
    });
    sendSuccess(req, res, { link });
  })
);

// ============================================================================
// Faculty & Employees Directory
// ============================================================================
academicsRouter.get(
  '/employees',
  requirePermission('faculty', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter: Record<string, unknown> = {};
    if (scope === 'department' && auth.scopes.departmentIds.length > 0) {
      filter.departmentId = { $in: auth.scopes.departmentIds };
    }
    const employees = await Employee.find(filter)
      .populate('departmentId', 'code name')
      .sort({ createdAt: -1 })
      .lean();
    sendSuccess(req, res, { employees });
  })
);

academicsRouter.post(
  '/employees',
  requirePermission('faculty', 'create'),
  validateBody(
    z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().email(),
      phone: z.string().trim().optional(),
      employeeType: z.enum(['Faculty', 'Administrative', 'Technical', 'Support']).default('Faculty'),
      deptCode: z.string().trim().min(2),
      designation: z.string().trim().min(2),
      qualification: z.string().trim().optional(),
      specialization: z.string().trim().optional(),
      baseSalaryInr: z.number().min(0).default(75000)
    })
  ),
  asyncHandler(async (req, res) => {
    const dept = await Department.findOne({ code: req.body.deptCode.toUpperCase() }).lean();
    if (!dept) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Department not found');

    const count = await Employee.countDocuments();
    const employeeCode = `EMP-2026-${String(count + 1).padStart(4, '0')}`;

    const employee = await Employee.create({
      employeeCode,
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone || '',
      employeeType: req.body.employeeType,
      departmentId: dept._id,
      deptCode: dept.code,
      designation: req.body.designation,
      qualification: req.body.qualification || '',
      specialization: req.body.specialization || '',
      baseSalaryInr: req.body.baseSalaryInr
    });

    await recordAuditEvent({
      req,
      action: `Appointed ${employee.employeeType}: ${employee.name} (${employee.employeeCode})`,
      category: 'hr',
      resourceType: 'Employee',
      resourceId: String(employee._id)
    });

    sendSuccess(req, res, { employee }, 201);
  })
);

// ============================================================================
// Timetable & Conflict Detection (FM-11)
// ============================================================================
academicsRouter.get(
  '/timetable',
  requirePermission('timetable', 'view'),
  asyncHandler(async (req, res) => {
    const { dayOfWeek, deptCode } = req.query as { dayOfWeek?: string; deptCode?: string };
    const filter: Record<string, unknown> = {};
    if (dayOfWeek && dayOfWeek !== 'ALL') filter.dayOfWeek = dayOfWeek;
    if (deptCode && deptCode !== 'ALL') {
      const dept = await Department.findOne({ code: deptCode.toUpperCase() }).lean();
      if (dept) filter.departmentId = dept._id;
    }
    const slots = await TimetableSlot.find(filter)
      .populate('departmentId', 'code name')
      .sort({ dayOfWeek: 1, slotTime: 1 })
      .lean();
    sendSuccess(req, res, { slots });
  })
);

academicsRouter.post(
  '/timetable',
  requirePermission('timetable', 'create'),
  validateBody(
    z.object({
      semesterNumber: z.number().int().min(1).max(12),
      batch: z.string().trim().min(2),
      section: z.string().trim().default('A'),
      dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slotTime: z.string().trim().min(3),
      subjectCode: z.string().trim().min(2),
      subjectName: z.string().trim().min(2),
      room: z.string().trim().min(2),
      deptCode: z.string().trim().min(2),
      facultyName: z.string().trim().min(2)
    })
  ),
  asyncHandler(async (req, res) => {
    const dept = await Department.findOne({ code: req.body.deptCode.toUpperCase() }).lean();
    if (!dept) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Department not found');

    const conflict = await TimetableSlot.findOne({
      dayOfWeek: req.body.dayOfWeek,
      slotTime: req.body.slotTime,
      $or: [
        { room: req.body.room },
        { facultyName: req.body.facultyName },
        { batch: req.body.batch, section: req.body.section, semesterNumber: req.body.semesterNumber }
      ]
    }).lean();

    if (conflict) {
      throw new AppError(
        409,
        ERROR_CODES.CONFLICT,
        `Timetable clash detected on ${req.body.dayOfWeek} (${req.body.slotTime}) for room, faculty, or batch/section.`
      );
    }

    const slot = await TimetableSlot.create({
      ...req.body,
      subjectCode: req.body.subjectCode.toUpperCase(),
      departmentId: dept._id
    });

    await recordAuditEvent({
      req,
      action: `Scheduled timetable slot ${slot.subjectCode} (${slot.dayOfWeek} ${slot.slotTime}, ${slot.room})`,
      category: 'academic',
      resourceType: 'TimetableSlot',
      resourceId: String(slot._id)
    });

    sendSuccess(req, res, { slot }, 201);
  })
);

academicsRouter.patch(
  '/timetable/:id',
  requirePermission('timetable', 'edit'),
  validateBody(
    z.object({
      dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).optional(),
      slotTime: z.string().trim().min(3).optional(),
      room: z.string().trim().min(2).optional(),
      facultyName: z.string().trim().min(2).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const existing = await TimetableSlot.findById(req.params.id);
    if (!existing) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Timetable slot not found');

    const dayOfWeek = req.body.dayOfWeek ?? existing.dayOfWeek;
    const slotTime = req.body.slotTime ?? existing.slotTime;
    const room = req.body.room ?? existing.room;
    const facultyName = req.body.facultyName ?? existing.facultyName;

    const conflict = await TimetableSlot.findOne({
      _id: { $ne: existing._id },
      dayOfWeek,
      slotTime,
      $or: [
        { room },
        { facultyName },
        { batch: existing.batch, section: existing.section, semesterNumber: existing.semesterNumber }
      ]
    }).lean();

    if (conflict) {
      throw new AppError(
        409,
        ERROR_CODES.CONFLICT,
        `Timetable clash detected on ${dayOfWeek} (${slotTime}) for room, faculty, or batch/section.`
      );
    }

    existing.dayOfWeek = dayOfWeek;
    existing.slotTime = slotTime;
    existing.room = room;
    existing.facultyName = facultyName;
    await existing.save();

    await recordAuditEvent({
      req,
      action: `Updated/substituted timetable slot ${existing.subjectCode} (${existing.dayOfWeek} ${existing.slotTime} -> ${existing.facultyName}, ${existing.room})`,
      category: 'academic',
      resourceType: 'TimetableSlot',
      resourceId: String(existing._id)
    });

    sendSuccess(req, res, { slot: existing });
  })
);

academicsRouter.delete(
  '/timetable/:id',
  requirePermission('timetable', 'delete'),
  asyncHandler(async (req, res) => {
    const deleted = await TimetableSlot.findByIdAndDelete(req.params.id).lean();
    if (!deleted) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Timetable slot not found');

    await recordAuditEvent({
      req,
      action: `Removed timetable slot ${deleted.subjectCode} (${deleted.dayOfWeek} ${deleted.slotTime})`,
      category: 'academic',
      resourceType: 'TimetableSlot',
      resourceId: String(deleted._id)
    });

    sendSuccess(req, res, { deletedId: String(deleted._id) });
  })
);

