import { Router } from 'express';
import { z } from 'zod';
import { ERROR_CODES } from '@cas-erp/shared';
import { recordAuditEvent } from '../../core/audit.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import {
  type AuthenticatedRequest,
  requireAuth,
  requirePermission
} from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { assertWorkflowStepAuthority } from '../../core/workflow.js';
import { Employee, GuardianLink, Student } from '../academics/models.js';
import { HolidayCalendar, LeaveRequest, PayrollRun } from './models.js';

export const hrRouter = Router();
hrRouter.use(requireAuth);

// ============================================================================
// Holiday Calendar
// ============================================================================
hrRouter.get(
  '/holidays',
  asyncHandler(async (req, res) => {
    const holidays = await HolidayCalendar.find().sort({ date: 1 }).lean();
    sendSuccess(req, res, { holidays });
  })
);

hrRouter.post(
  '/holidays',
  requirePermission('hr', 'configure'),
  validateBody(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      name: z.string().trim().min(2),
      nameHi: z.string().trim().optional(),
      type: z.enum(['Gazetted', 'Restricted', 'AcademicBreak']).default('Gazetted')
    })
  ),
  asyncHandler(async (req, res) => {
    const holiday = await HolidayCalendar.create(req.body);
    sendSuccess(req, res, { holiday }, 201);
  })
);

// ============================================================================
// Unified Leave Management (Employee Leave + Student Leave / Outpass)
// ============================================================================
hrRouter.get(
  '/leave/requests',
  requirePermission('leave', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const { status, applicantType } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};
    if (status && status !== 'ALL') filter.status = status;
    if (applicantType && applicantType !== 'ALL') filter.applicantType = applicantType;

    if (scope === 'own') {
      filter.applicantUserId = auth.userId;
    } else if (scope === 'linked-student') {
      const links = await GuardianLink.find({
        guardianUserId: auth.userId,
        verificationStatus: 'verified'
      }).lean();
      filter.studentId = { $in: links.map((l) => l.studentId) };
    } else if (scope === 'department' && auth.scopes.departmentIds.length > 0) {
      filter.departmentId = { $in: auth.scopes.departmentIds };
    }

    const requests = await LeaveRequest.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    sendSuccess(req, res, { requests });
  })
);

hrRouter.post(
  '/leave/requests',
  requirePermission('leave', 'create'),
  validateBody(
    z.object({
      applicantType: z.enum(['student', 'employee']),
      studentId: z.string().optional(),
      employeeId: z.string().optional(),
      leaveType: z.string().trim().min(2),
      fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      halfDay: z.boolean().default(false),
      reason: z.string().trim().min(5),
      urgency: z.enum(['normal', 'high', 'emergency']).default('normal'),
      contactDuringLeave: z.string().trim().optional(),
      isHostelOutpass: z.boolean().default(false),
      parentApprovalRequired: z.boolean().default(false)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const from = new Date(req.body.fromDate);
    const to = new Date(req.body.toDate);
    if (to < from) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'toDate cannot be earlier than fromDate');
    }

    const days = req.body.halfDay
      ? 0.5
      : Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);

    let applicantName = auth.name;
    let applicantCode = auth.email;
    let departmentId = null;
    let deptCode = '';
    let studentId = null;
    let employeeId = null;

    if (req.body.applicantType === 'student') {
      const stu = req.body.studentId
        ? await Student.findById(req.body.studentId).lean()
        : auth.linkedStudentId
        ? await Student.findById(auth.linkedStudentId).lean()
        : await Student.findOne({ userId: auth.userId }).lean();
      if (!stu) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student profile not found');
      applicantName = stu.name;
      applicantCode = stu.rollNumber;
      departmentId = stu.departmentId;
      deptCode = stu.deptCode;
      studentId = stu._id;
    } else {
      const emp = req.body.employeeId
        ? await Employee.findById(req.body.employeeId).lean()
        : auth.linkedEmployeeId
        ? await Employee.findById(auth.linkedEmployeeId).lean()
        : await Employee.findOne({ userId: auth.userId }).lean();
      if (!emp) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Employee profile not found');
      applicantName = emp.name;
      applicantCode = emp.employeeCode;
      departmentId = emp.departmentId;
      deptCode = emp.deptCode;
      employeeId = emp._id;
    }

    const requestNo = `LV-2026-${String(Date.now()).slice(-6)}`;
    const leaveRequest = await LeaveRequest.create({
      requestNo,
      applicantType: req.body.applicantType,
      applicantUserId: auth.userId,
      applicantName,
      applicantCode,
      studentId,
      employeeId,
      departmentId,
      deptCode,
      leaveType: req.body.leaveType.toUpperCase(),
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      days,
      halfDay: req.body.halfDay,
      reason: req.body.reason,
      urgency: req.body.urgency,
      contactDuringLeave: req.body.contactDuringLeave || '',
      isHostelOutpass: req.body.isHostelOutpass,
      parentApprovalRequired: req.body.parentApprovalRequired,
      status: 'pending'
    });

    await recordAuditEvent({
      req,
      action: `Submitted ${req.body.applicantType} leave ${requestNo} (${req.body.leaveType}, ${days} days)`,
      category: 'leave',
      resourceType: 'LeaveRequest',
      resourceId: String(leaveRequest._id)
    });

    sendSuccess(req, res, { leaveRequest }, 201);
  })
);

hrRouter.post(
  '/leave/requests/:id/decision',
  requirePermission('leave', 'approve'),
  validateBody(
    z.object({
      decision: z.enum(['approved', 'rejected']),
      remarks: z.string().trim().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Leave request not found');

    if (auth.activeRole === 'PARENT') {
      if (!leave.parentApprovalRequired) {
        throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Parent approval is not enabled for this request');
      }
      leave.parentApproved = req.body.decision === 'approved';
      if (req.body.decision === 'rejected') leave.status = 'rejected';
      await leave.save();
      sendSuccess(req, res, { leaveRequest: leave });
      return;
    }

    await assertWorkflowStepAuthority('leave', 1, auth.userId, auth.activeRole, String(leave.applicantUserId));

    leave.status = req.body.decision;
    leave.reviewedByUserId = auth.userId as never;
    leave.reviewedByName = auth.name;
    leave.reviewedAt = new Date();
    leave.remarks = req.body.remarks || '';
    await leave.save();

    // Deduct balance for approved employee leave
    if (req.body.decision === 'approved' && leave.applicantType === 'employee' && leave.employeeId) {
      const emp = await Employee.findById(leave.employeeId);
      if (emp && emp.leaveBalances) {
        const balances = emp.leaveBalances as Record<string, number>;
        if (typeof balances[leave.leaveType] === 'number') {
          balances[leave.leaveType] = Math.max(0, balances[leave.leaveType] - leave.days);
          await emp.save();
        }
      }
    }

    await recordAuditEvent({
      req,
      action: `${req.body.decision.toUpperCase()} leave request ${leave.requestNo}`,
      category: 'leave',
      resourceType: 'LeaveRequest',
      resourceId: String(leave._id)
    });

    sendSuccess(req, res, { leaveRequest: leave });
  })
);

// ============================================================================
// Payroll Preparation & Approval (FM-05)
// ============================================================================
hrRouter.get(
  '/payroll',
  requirePermission('payroll', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter: Record<string, unknown> = {};
    if (scope === 'own' && auth.linkedEmployeeId) {
      filter.employeeId = auth.linkedEmployeeId;
    }
    const runs = await PayrollRun.find(filter).sort({ monthKey: -1, employeeCode: 1 }).lean();
    sendSuccess(req, res, { payrollRuns: runs });
  })
);

hrRouter.post(
  '/payroll/prepare',
  requirePermission('payroll', 'create'),
  validateBody(z.object({ monthKey: z.string().regex(/^\d{4}-\d{2}$/) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const employees = await Employee.find({ status: 'Active' }).lean();
    const created = [];

    for (const emp of employees) {
      const existing = await PayrollRun.findOne({ monthKey: req.body.monthKey, employeeId: emp._id }).lean();
      if (existing) continue;

      const grossInr = emp.baseSalaryInr + emp.hraInr + emp.daInr;
      const netInr = Math.max(0, grossInr - emp.deductionsInr);
      const run = await PayrollRun.create({
        payrollNo: `PAY-${req.body.monthKey}-${emp.employeeCode}`,
        monthKey: req.body.monthKey,
        employeeId: emp._id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        baseSalaryInr: emp.baseSalaryInr,
        hraInr: emp.hraInr,
        daInr: emp.daInr,
        grossInr,
        deductionsInr: emp.deductionsInr,
        netInr,
        status: 'draft',
        preparedByUserId: auth.userId
      });
      created.push(run);
    }

    await recordAuditEvent({
      req,
      action: `Prepared payroll batch for ${req.body.monthKey} (${created.length} employees)`,
      category: 'hr',
      resourceType: 'PayrollRun',
      resourceId: req.body.monthKey
    });

    sendSuccess(req, res, { createdCount: created.length, payrollRuns: created }, 201);
  })
);

hrRouter.post(
  '/payroll/:id/approve',
  requirePermission('payroll', 'approve'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const run = await PayrollRun.findById(req.params.id);
    if (!run) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Payroll run not found');
    if (String(run.preparedByUserId) === auth.userId) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Segregation of duties: preparer cannot self-approve payroll');
    }

    run.status = 'approved';
    run.approvedByUserId = auth.userId as never;
    run.approvedAt = new Date();
    await run.save();

    await recordAuditEvent({
      req,
      action: `Approved payroll ${run.payrollNo} (₹${run.netInr})`,
      category: 'hr',
      resourceType: 'PayrollRun',
      resourceId: String(run._id)
    });

    sendSuccess(req, res, { payrollRun: run });
  })
);
