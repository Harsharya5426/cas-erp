import { Router } from 'express';
import { z } from 'zod';
import { ERROR_CODES, PROGRAM_TYPES, paginationQuerySchema } from '@cas-erp/shared';
import { recordAuditEvent } from '../../core/audit.js';
import { sha256Hex } from '../../core/crypto.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import { type AuthenticatedRequest, requireAuth, requirePermission } from '../../core/rbac.js';
import { DEFAULT_WORKFLOWS, ApprovalWorkflow } from '../../core/workflow.js';
import { sendSuccess, validateBody, validateQuery } from '../../core/requestContext.js';
import { env } from '../../config/env.js';
import {
  AcademicSession,
  Department,
  InstitutionSettings,
  MigrationBatch,
  Program,
  Subject
} from './models.js';

export const orgRouter = Router();
orgRouter.use(requireAuth);

orgRouter.get(
  '/settings',
  requirePermission('settings', 'view'),
  asyncHandler(async (req, res) => {
    let settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
    if (!settings) {
      settings = await InstitutionSettings.create({
        singletonKey: 'CAS_PRIMARY',
        institutionName: 'Centre for Advanced Studies',
        institutionNameHi: 'सेंटर फॉर एडवांस्ड स्टडीज',
        affiliation: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow',
        campusAddress: 'AKTU Main Campus, Sector 11, Jankipuram Extension, Lucknow, UP, India',
        activeAcademicYear: '2026 - 2027',
        activeSemesterLabel: 'Odd Semester 2026-27'
      });
    }
    sendSuccess(req, res, { settings });
  })
);

orgRouter.patch(
  '/settings',
  requirePermission('settings', 'configure'),
  validateBody(
    z.object({
      institutionName: z.string().trim().min(3).optional(),
      institutionNameHi: z.string().trim().min(2).optional(),
      domain: z.string().trim().min(3).optional(),
      activeAcademicYear: z.string().trim().min(4).optional(),
      activeSemesterLabel: z.string().trim().min(3).optional(),
      regulatoryCode: z.string().trim().optional(),
      treasuryEmail: z.string().email().optional(),
      attendanceShortageThresholdPct: z.number().min(0).max(100).optional(),
      aktuConfig: z
        .object({
          version: z.string().optional(),
          passingCGPA: z.number().min(0).max(10).optional(),
          maxBacklogsAllowedForPromotion: z.number().int().min(0).optional(),
          admitCardMinAttendancePct: z.number().min(0).max(100).optional()
        })
        .optional(),
      biometrics: z
        .object({
          privacyAssessmentApproved: z.boolean().optional(),
          faceMatchingEnabled: z.boolean().optional(),
          nonBiometricAlternativeRequired: z.boolean().optional(),
          retentionDays: z.number().int().min(30).max(3650).optional(),
          consentNoticeVersion: z.string().optional()
        })
        .optional(),
      aiGovernance: z
        .object({
          enabled: z.boolean().optional(),
          advisoryOnlyEnforced: z.boolean().optional(),
          requireHumanReviewForActions: z.boolean().optional()
        })
        .optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (body.biometrics?.faceMatchingEnabled) {
      const existing = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
      const privacyApproved =
        body.biometrics.privacyAssessmentApproved ?? existing?.biometrics?.privacyAssessmentApproved;
      if (!privacyApproved || !env.BIOMETRIC_POLICY_APPROVED) {
        throw new AppError(
          403,
          ERROR_CODES.POLICY_GATE_BLOCKED,
          'Face matching cannot be activated until privacy/legal assessment is approved and BIOMETRIC_POLICY_APPROVED=true is configured.'
        );
      }
    }

    const updated = await InstitutionSettings.findOneAndUpdate(
      { singletonKey: 'CAS_PRIMARY' },
      { $set: body },
      { new: true, upsert: true }
    );
    await recordAuditEvent({
      req,
      action: 'Updated institutional governance and regulatory settings',
      category: 'system',
      resourceType: 'InstitutionSettings',
      resourceId: 'CAS_PRIMARY'
    });
    sendSuccess(req, res, { settings: updated });
  })
);

orgRouter.get(
  '/workflows',
  requirePermission('settings', 'view'),
  asyncHandler(async (req, res) => {
    const dbWorkflows = await ApprovalWorkflow.find({ active: true }).sort({ domain: 1 }).lean();
    const byDomain = new Map(dbWorkflows.map((w) => [w.domain, w]));
    const workflows = DEFAULT_WORKFLOWS.map((def) => byDomain.get(def.domain) || def);
    sendSuccess(req, res, { workflows });
  })
);

orgRouter.put(
  '/workflows/:domain',
  requirePermission('settings', 'configure'),
  validateBody(
    z.object({
      name: z.string().trim().min(3).max(120),
      steps: z
        .array(
          z.object({
            order: z.number().int().min(1).max(10),
            name: z.string().trim().min(2).max(100),
            allowedRoleKeys: z.array(z.string().trim().min(2)).min(1),
            preventSelfApproval: z.boolean().default(true)
          })
        )
        .min(1)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const domain = req.params.domain as
      | 'admissions'
      | 'leave'
      | 'marks'
      | 'refunds'
      | 'procurement'
      | 'certificates';
    const validDomains = ['admissions', 'leave', 'marks', 'refunds', 'procurement', 'certificates'];
    if (!validDomains.includes(domain)) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, `Unsupported workflow domain: ${domain}`);
    }

    const latest = await ApprovalWorkflow.findOne({ domain }).sort({ version: -1 }).lean();
    const nextVersion = latest ? latest.version + 1 : 2;
    await ApprovalWorkflow.updateMany({ domain, active: true }, { $set: { active: false } });

    const workflow = await ApprovalWorkflow.create({
      domain,
      version: nextVersion,
      name: req.body.name,
      active: true,
      steps: req.body.steps,
      updatedBy: auth.userId
    });

    await recordAuditEvent({
      req,
      action: `Published ${domain} approval workflow v${workflow.version} (${workflow.name})`,
      category: 'rbac',
      resourceType: 'ApprovalWorkflow',
      resourceId: String(workflow._id),
      metadata: { domain, version: workflow.version, stepCount: workflow.steps.length }
    });

    sendSuccess(req, res, { workflow });
  })
);

orgRouter.get(
  '/departments',
  asyncHandler(async (req, res) => {
    const departments = await Department.find({ active: true }).sort({ code: 1 }).lean();
    sendSuccess(req, res, { departments });
  })
);

orgRouter.post(
  '/departments',
  requirePermission('academics', 'configure'),
  validateBody(
    z.object({
      code: z.string().trim().min(2).max(16),
      name: z.string().trim().min(2).max(120),
      nameHi: z.string().trim().optional(),
      hodName: z.string().trim().optional(),
      annualBudgetInr: z.number().min(0).default(0)
    })
  ),
  asyncHandler(async (req, res) => {
    const dept = await Department.create(req.body);
    await recordAuditEvent({
      req,
      action: `Created department ${dept.code} (${dept.name})`,
      category: 'academic',
      resourceType: 'Department',
      resourceId: String(dept._id)
    });
    sendSuccess(req, res, { department: dept }, 201);
  })
);

orgRouter.get(
  '/programs',
  asyncHandler(async (req, res) => {
    const programs = await Program.find({ active: true }).populate('departmentId', 'code name').lean();
    sendSuccess(req, res, { programs });
  })
);

orgRouter.post(
  '/programs',
  requirePermission('academics', 'configure'),
  validateBody(
    z.object({
      code: z.string().trim().min(2).max(20),
      name: z.string().trim().min(2).max(140),
      programType: z.enum(PROGRAM_TYPES),
      departmentId: z.string().min(10),
      durationSemesters: z.number().int().min(1).max(12),
      totalCredits: z.number().int().min(1)
    })
  ),
  asyncHandler(async (req, res) => {
    const program = await Program.create(req.body);
    await recordAuditEvent({
      req,
      action: `Created academic program ${program.code}`,
      category: 'academic',
      resourceType: 'Program',
      resourceId: String(program._id)
    });
    sendSuccess(req, res, { program }, 201);
  })
);

orgRouter.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const sessions = await AcademicSession.find().sort({ startDate: -1 }).lean();
    sendSuccess(req, res, { sessions });
  })
);

orgRouter.get(
  '/subjects',
  validateQuery(paginationQuerySchema.extend({ departmentId: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const { search, departmentId } = res.locals.query as { search?: string; departmentId?: string };
    const filter: Record<string, unknown> = { active: true };
    if (departmentId) filter.departmentId = departmentId;
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    const subjects = await Subject.find(filter)
      .populate('departmentId', 'code name')
      .sort({ semesterNumber: 1, code: 1 })
      .lean();
    sendSuccess(req, res, { subjects });
  })
);

orgRouter.post(
  '/subjects',
  requirePermission('academics', 'create'),
  validateBody(
    z.object({
      code: z.string().trim().min(2).max(20),
      name: z.string().trim().min(2).max(160),
      nameHi: z.string().trim().optional(),
      departmentId: z.string().min(10),
      semesterNumber: z.number().int().min(1).max(12),
      credits: z.number().min(0).max(20),
      subjectType: z.enum(['Theory', 'Practical', 'Project', 'Audit']).default('Theory'),
      facultyName: z.string().trim().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const subject = await Subject.create(req.body);
    await recordAuditEvent({
      req,
      action: `Registered curriculum subject ${subject.code} - ${subject.name}`,
      category: 'academic',
      resourceType: 'Subject',
      resourceId: String(subject._id)
    });
    sendSuccess(req, res, { subject }, 201);
  })
);

orgRouter.patch(
  '/subjects/:id',
  requirePermission('academics', 'edit'),
  validateBody(
    z.object({
      syllabusProgressPct: z.number().min(0).max(100).optional(),
      facultyName: z.string().trim().optional(),
      credits: z.number().min(0).max(20).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const subject = await Subject.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!subject) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Subject not found');
    await recordAuditEvent({
      req,
      action: `Updated subject ${subject.code}`,
      category: 'academic',
      resourceType: 'Subject',
      resourceId: String(subject._id)
    });
    sendSuccess(req, res, { subject });
  })
);

// Migration Dry-Run & Commit Harness (PRD 11)
orgRouter.get(
  '/migration/batches',
  requirePermission('migration', 'view'),
  asyncHandler(async (req, res) => {
    const batches = await MigrationBatch.find().sort({ createdAt: -1 }).limit(25).lean();
    sendSuccess(req, res, { batches });
  })
);

orgRouter.post(
  '/migration/batches',
  requirePermission('migration', 'create'),
  validateBody(
    z.object({
      sourceSystem: z.string().trim().min(2),
      entityType: z.enum(['departments', 'subjects']),
      mode: z.enum(['dry_run', 'committed']).default('dry_run'),
      rows: z.array(z.record(z.string(), z.unknown())).min(1).max(500)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const { sourceSystem, entityType, mode, rows } = req.body;
    const checksum = sha256Hex(JSON.stringify(rows));
    const rejections: Array<{ rowNumber: number; sourceId: string; reason: string }> = [];
    const validRecords: Array<Record<string, unknown>> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sourceId = String(row.sourceId || row.code || `row-${i + 1}`);
      if (entityType === 'departments') {
        if (!row.code || !row.name) {
          rejections.push({ rowNumber: i + 1, sourceId, reason: 'Missing code or name' });
          continue;
        }
        validRecords.push({
          code: String(row.code).toUpperCase().trim(),
          name: String(row.name).trim(),
          hodName: String(row.hodName || ''),
          annualBudgetInr: Number(row.annualBudgetInr) || 0
        });
      } else {
        if (!row.code || !row.name || !row.departmentCode) {
          rejections.push({ rowNumber: i + 1, sourceId, reason: 'Missing code, name, or departmentCode' });
          continue;
        }
        const dept = await Department.findOne({ code: String(row.departmentCode).toUpperCase() }).lean();
        if (!dept) {
          rejections.push({ rowNumber: i + 1, sourceId, reason: `Unknown departmentCode ${row.departmentCode}` });
          continue;
        }
        validRecords.push({
          code: String(row.code).toUpperCase().trim(),
          name: String(row.name).trim(),
          departmentId: dept._id,
          semesterNumber: Number(row.semesterNumber) || 1,
          credits: Number(row.credits) || 4
        });
      }
    }

    let committedCount = 0;
    if (mode === 'committed') {
      for (const rec of validRecords) {
        if (entityType === 'departments') {
          await Department.updateOne({ code: rec.code }, { $setOnInsert: rec }, { upsert: true });
        } else {
          await Subject.updateOne({ code: rec.code }, { $setOnInsert: rec }, { upsert: true });
        }
        committedCount += 1;
      }
    }

    const batch = await MigrationBatch.create({
      sourceSystem,
      entityType,
      mode,
      fileChecksumSha256: checksum,
      totalRows: rows.length,
      validRows: validRecords.length,
      rejectedRows: rejections.length,
      rejections,
      reconciliationSummary: {
        committedCount,
        checksum
      },
      executedBy: auth.userId
    });

    await recordAuditEvent({
      req,
      action: `Executed migration batch (${mode}) for ${entityType}: ${validRecords.length} valid, ${rejections.length} rejected`,
      category: 'migration',
      resourceType: 'MigrationBatch',
      resourceId: String(batch._id)
    });

    sendSuccess(req, res, { batch }, 201);
  })
);

