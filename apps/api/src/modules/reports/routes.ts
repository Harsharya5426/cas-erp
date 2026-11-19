import { Router } from 'express';
import { z } from 'zod';
import { ERROR_CODES } from '@cas-erp/shared';
import { env } from '../../config/env.js';
import { recordAuditEvent } from '../../core/audit.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import { type AuthenticatedRequest, requireAuth, requirePermission } from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { Employee, Student } from '../academics/models.js';
import { AttendanceEvent } from '../attendance/models.js';
import { PaymentTransaction } from '../finance/models.js';
import { LeaveRequest } from '../hr/models.js';
import { Department, InstitutionSettings } from '../org/models.js';

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

reportsRouter.get(
  '/summary',
  requirePermission('reports', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;

    const studentFilter: Record<string, unknown> = {};
    if (scope === 'department' && auth.scopes.departmentIds.length > 0) {
      studentFilter.departmentId = { $in: auth.scopes.departmentIds };
    }

    const [
      totalStudents,
      totalEmployees,
      departments,
      paidTxns,
      pendingLeaves,
      defaultersCount
    ] = await Promise.all([
      Student.countDocuments(studentFilter),
      Employee.countDocuments(),
      Department.countDocuments({ active: true }),
      PaymentTransaction.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amountInr' }, count: { $sum: 1 } } }
      ]),
      LeaveRequest.countDocuments({ status: 'pending' }),
      Student.countDocuments({ ...studentFilter, attendancePct: { $lt: 75 } })
    ]);

    sendSuccess(req, res, {
      kpis: {
        totalStudents,
        totalEmployees,
        departments,
        totalRealizedFeeInr: paidTxns[0]?.total ?? 0,
        settledPaymentCount: paidTxns[0]?.count ?? 0,
        pendingLeaves,
        attendanceShortageCount: defaultersCount
      }
    });
  })
);

reportsRouter.post(
  '/export',
  requirePermission('reports', 'export'),
  validateBody(
    z.object({
      dataset: z.enum(['students', 'payments', 'attendance', 'defaulters']),
      format: z.enum(['csv', 'json']).default('csv')
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    let rows: Array<Record<string, unknown>> = [];

    if (req.body.dataset === 'students' || req.body.dataset === 'defaulters') {
      const filter: Record<string, unknown> = req.body.dataset === 'defaulters' ? { attendancePct: { $lt: 75 } } : {};
      if (scope === 'department' && auth.scopes.departmentIds.length > 0) {
        filter.departmentId = { $in: auth.scopes.departmentIds };
      }
      rows = (await Student.find(filter).select('studentCode rollNumber name deptCode semesterNumber attendancePct cgpa dueFeeInr feeStatus').lean()) as unknown as Array<Record<string, unknown>>;
    } else if (req.body.dataset === 'payments') {
      rows = (await PaymentTransaction.find({ status: 'paid' }).select('receiptNo rollNumber studentName feeHead amountInr channel settledAt').lean()) as unknown as Array<Record<string, unknown>>;
    } else {
      rows = (await AttendanceEvent.find().sort({ sessionDate: -1 }).limit(200).select('personCode personName subjectCode sessionDate status captureMethod').lean()) as unknown as Array<Record<string, unknown>>;
    }

    await recordAuditEvent({
      req,
      action: `Exported bulk ${req.body.dataset} report (${rows.length} rows, ${req.body.format})`,
      category: 'system',
      resourceType: 'ReportExport',
      resourceId: req.body.dataset
    });

    if (req.body.format === 'json') {
      sendSuccess(req, res, { rows });
      return;
    }

    if (rows.length === 0) {
      sendSuccess(req, res, { csv: '', rowCount: 0 });
      return;
    }

    const headers = Object.keys(rows[0]).filter((k) => k !== '_id');
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ];
    sendSuccess(req, res, { csv: csvLines.join('\n'), rowCount: rows.length });
  })
);

// ============================================================================
// Governed AI Assistant & Python ML Service Bridge (PRD 12)
// ============================================================================
reportsRouter.post(
  '/ai/assist',
  requirePermission('ai', 'submit'),
  validateBody(
    z.object({
      prompt: z.string().trim().min(3).max(600),
      contextDomain: z.enum(['attendance_risk', 'general_helpdesk', 'timetable_advice']).default('general_helpdesk')
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
    if (!env.AI_ASSISTANT_ENABLED || settings?.aiGovernance?.enabled === false) {
      throw new AppError(
        503,
        ERROR_CODES.POLICY_GATE_BLOCKED,
        'AI Assistance is currently disabled by institutional governance settings.'
      );
    }

    // Attempt optional internal Python ML service if running; otherwise deterministic safe advisory summary
    let mlAdvisory: Record<string, unknown> | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const resp = await fetch(`${env.ML_SERVICE_URL}/v1/advisory/attendance-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Token': env.ML_SERVICE_TOKEN
        },
        body: JSON.stringify({ role: auth.activeRole, domain: req.body.contextDomain }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (resp.ok) mlAdvisory = (await resp.json()) as Record<string, unknown>;
    } catch {
      // Python ML sidecar optional in local dev
    }

    const shortageStudents = await Student.find({ attendancePct: { $lt: 75 } })
      .select('rollNumber deptCode attendancePct')
      .limit(5)
      .lean();

    await recordAuditEvent({
      req,
      action: `Used governed AI advisory assistant (${req.body.contextDomain})`,
      category: 'ai',
      resourceType: 'AiAssistant',
      resourceId: req.body.contextDomain
    });

    sendSuccess(req, res, {
      advisoryOnly: true,
      humanApprovalRequired: true,
      modelMetadata: {
        provider: mlAdvisory ? 'cas-python-ml-service' : 'cas-deterministic-rule-advisor',
        version: '1.0.0',
        piiRedacted: true
      },
      summary:
        req.body.contextDomain === 'attendance_risk'
          ? `Advisory check identified ${shortageStudents.length} student record(s) currently below the 75% institutional threshold. Human review by faculty/HOD is required before issuing shortage notices.`
          : `Advisory response for ${auth.activeRole}: All admissions, marks publication, fee refunds, and grievance resolutions remain strictly human-approved.`,
      citations: shortageStudents.map((s) => ({
        recordType: 'Student',
        rollNumber: s.rollNumber,
        deptCode: s.deptCode,
        attendancePct: s.attendancePct
      })),
      mlAdvisory
    });
  })
);

