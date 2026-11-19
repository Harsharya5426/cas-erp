import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ERROR_CODES } from '@cas-erp/shared';
import { storePrivateObject } from '../../adapters/storage.js';
import { recordAuditEvent } from '../../core/audit.js';
import { hashPassword, sha256Hex } from '../../core/crypto.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import { type AuthenticatedRequest, getPermissionRule, requireAuth, requirePermission } from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { assertWorkflowStepAuthority } from '../../core/workflow.js';
import { Employee, Student } from '../academics/models.js';
import { Invoice } from '../finance/models.js';
import { RoleAssignment, User } from '../identity/models.js';
import { Announcement } from '../notifications/models.js';
import { Department } from '../org/models.js';
import { Applicant, CmsPage } from './models.js';
import { CertificateRecord } from '../campus/models.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ============================================================================
// Public Unauthenticated Website, Admissions Application & QR Verification
// ============================================================================
export const publicRouter = Router();

publicRouter.get(
  '/cms/:slug',
  asyncHandler(async (req, res) => {
    const page = await CmsPage.findOne({ slug: String(req.params.slug).toLowerCase(), published: true }).lean();
    if (!page) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Page not found');
    sendSuccess(req, res, { page });
  })
);

publicRouter.get(
  '/cms',
  asyncHandler(async (req, res) => {
    const pages = await CmsPage.find({ published: true }).select('slug title titleHi summary summaryHi').lean();
    const departments = await Department.find({ active: true }).select('code name nameHi').lean();
    sendSuccess(req, res, { pages, departments });
  })
);

publicRouter.get(
  '/notices',
  asyncHandler(async (req, res) => {
    const notices = await Announcement.find({ isPublic: true })
      .sort({ publishedAt: -1 })
      .limit(20)
      .lean();
    sendSuccess(req, res, { notices });
  })
);

publicRouter.post(
  '/admissions/apply',
  validateBody(
    z.object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().email(),
      phone: z.string().trim().min(10).max(20),
      deptCode: z.string().trim().min(2),
      programCode: z.string().trim().min(2),
      qualifyingExamName: z.string().trim().min(2),
      qualifyingScorePct: z.number().min(0).max(100),
      guardianName: z.string().trim().min(2),
      guardianPhone: z.string().trim().min(10).max(20)
    })
  ),
  asyncHandler(async (req, res) => {
    const dept = await Department.findOne({ code: req.body.deptCode.toUpperCase() }).lean();
    if (!dept) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Selected department not found');

    const count = await Applicant.countDocuments();
    const applicationNo = `APP-2026-${String(count + 1).padStart(4, '0')}`;
    const trackingPin = String(100000 + Math.floor(Math.random() * 899999));

    const applicant = await Applicant.create({
      applicationNo,
      trackingPinHash: sha256Hex(trackingPin),
      fullName: req.body.fullName,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone,
      departmentId: dept._id,
      programCode: req.body.programCode.toUpperCase(),
      qualifyingExamName: req.body.qualifyingExamName,
      qualifyingScorePct: req.body.qualifyingScorePct,
      guardianName: req.body.guardianName,
      guardianPhone: req.body.guardianPhone,
      status: 'submitted'
    });

    await recordAuditEvent({
      req,
      actor: { email: applicant.email, name: applicant.fullName, role: 'APPLICANT' },
      action: `Submitted online admission application ${applicationNo}`,
      category: 'admissions',
      resourceType: 'Applicant',
      resourceId: String(applicant._id)
    });

    sendSuccess(
      req,
      res,
      {
        applicationNo,
        trackingPin,
        status: applicant.status
      },
      201
    );
  })
);

publicRouter.get(
  '/admissions/track',
  asyncHandler(async (req, res) => {
    const applicationNo = String(req.query.applicationNo || '').toUpperCase().trim();
    const pin = String(req.query.pin || '').trim();
    if (!applicationNo || !pin) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'applicationNo and tracking PIN are required');
    }

    const applicant = await Applicant.findOne({ applicationNo }).populate('departmentId', 'code name').lean();
    if (!applicant || applicant.trackingPinHash !== sha256Hex(pin)) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Application not found or tracking PIN mismatch');
    }

    sendSuccess(req, res, {
      applicationNo: applicant.applicationNo,
      fullName: applicant.fullName,
      programCode: applicant.programCode,
      department: applicant.departmentId,
      status: applicant.status,
      remarks: applicant.remarks,
      updatedAt: applicant.updatedAt
    });
  })
);

publicRouter.get(
  '/certificates/verify/:token',
  asyncHandler(async (req, res) => {
    const cert = await CertificateRecord.findOne({ qrVerificationToken: req.params.token }).lean();
    if (!cert) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Certificate verification token not found');
    }
    sendSuccess(req, res, {
      valid: cert.status === 'signed_issued',
      serialNo: cert.serialNo,
      studentName: cert.studentName,
      rollNumber: cert.rollNumber,
      certificateType: cert.certificateType,
      status: cert.status,
      signedByName: cert.signedByName,
      issuedAt: cert.issuedAt
    });
  })
);

publicRouter.get(
  '/faculty',
  asyncHandler(async (req, res) => {
    const deptCode = req.query.deptCode ? String(req.query.deptCode).toUpperCase().trim() : '';
    const filter: Record<string, unknown> = { employeeType: 'Faculty', status: 'Active' };
    if (deptCode && deptCode !== 'ALL') filter.deptCode = deptCode;

    const faculty = await Employee.find(filter)
      .select(
        'employeeCode name email deptCode designation administrativeRoles qualification specialization areasOfInterest bio photoUrl publicationsCount googleScholarUrl scopusUrl orcidUrl researchGateUrl publicationsPdfUrl profilePageUrl'
      )
      .lean();

    // Deduplicate by normalized name, preferring records with official photoUrl/links
    const dedupMap = new Map<string, (typeof faculty)[number]>();
    for (const f of faculty) {
      const key = String(f.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const existing = dedupMap.get(key);
      if (!existing || (!existing.photoUrl && f.photoUrl)) {
        dedupMap.set(key, f);
      }
    }
    const deduped = Array.from(dedupMap.values());

    // Place Dean Academics (Dr. Anuj Kumar Sharma) first, then those with photos, then by employeeCode
    deduped.sort((a, b) => {
      const aDean = a.name?.toLowerCase().includes('anuj kumar sharma') ? 0 : 1;
      const bDean = b.name?.toLowerCase().includes('anuj kumar sharma') ? 0 : 1;
      if (aDean !== bDean) return aDean - bDean;
      const aPhoto = a.photoUrl ? 0 : 1;
      const bPhoto = b.photoUrl ? 0 : 1;
      if (aPhoto !== bPhoto) return aPhoto - bPhoto;
      return String(a.employeeCode).localeCompare(String(b.employeeCode));
    });

    sendSuccess(req, res, { faculty: deduped, count: deduped.length });
  })
);

// ============================================================================
// Protected Admissions & CMS Administration Routes
// ============================================================================
export const admissionsRouter = Router();
admissionsRouter.use(requireAuth);

admissionsRouter.get(
  '/applicants',
  requirePermission('admissions', 'view'),
  asyncHandler(async (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    const filter: Record<string, unknown> = {};
    if (status && status !== 'ALL') filter.status = status;
    const applicants = await Applicant.find(filter)
      .select('-trackingPinHash')
      .populate('departmentId', 'code name')
      .sort({ createdAt: -1 })
      .lean();
    sendSuccess(req, res, { applicants });
  })
);

admissionsRouter.post(
  '/applicants/:id/documents',
  requirePermission('admissions', 'edit'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Applicant not found');
    if (!req.file) throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Document file is required');

    const stored = await storePrivateObject({
      folder: `admissions/${applicant.applicationNo}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer
    });

    applicant.documents.push({
      label: String(req.body.label || req.file.originalname),
      objectKey: stored.objectKey,
      sha256: stored.sha256,
      mimeType: stored.mimeType,
      malwareScanStatus: stored.malwareScanStatus,
      verified: false
    });
    await applicant.save();

    await recordAuditEvent({
      req,
      action: `Uploaded admission document for ${applicant.applicationNo}`,
      category: 'admissions',
      resourceType: 'Applicant',
      resourceId: String(applicant._id)
    });

    sendSuccess(req, res, { documents: applicant.documents }, 201);
  })
);

admissionsRouter.post(
  '/applicants/:id/transition',
  requireAuth,
  validateBody(
    z.object({
      targetStatus: z.enum(['docs_verified', 'merit_shortlisted', 'approved', 'rejected']),
      remarks: z.string().trim().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const requiredVerb = req.body.targetStatus === 'approved'
      ? 'approve'
      : req.body.targetStatus === 'rejected'
      ? 'reject'
      : 'submit';
    const rule = getPermissionRule(auth, 'admissions', requiredVerb);
    if (!rule) {
      throw new AppError(
        403,
        ERROR_CODES.FORBIDDEN,
        `Role ${auth.activeRole} is not permitted to ${requiredVerb} admissions`
      );
    }

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Applicant not found');

    const stepOrder = req.body.targetStatus === 'approved' || req.body.targetStatus === 'rejected' ? 2 : 1;
    await assertWorkflowStepAuthority('admissions', stepOrder, auth.userId, auth.activeRole);

    applicant.status = req.body.targetStatus;
    if (req.body.remarks) applicant.remarks = req.body.remarks;
    if (req.body.targetStatus === 'docs_verified') {
      applicant.verifiedByUserId = auth.userId as never;
      applicant.documents.forEach((d) => {
        d.verified = true;
      });
    }
    if (req.body.targetStatus === 'approved') {
      applicant.approvedByUserId = auth.userId as never;
    }
    await applicant.save();

    await recordAuditEvent({
      req,
      action: `Transitioned application ${applicant.applicationNo} to ${applicant.status}`,
      category: 'admissions',
      resourceType: 'Applicant',
      resourceId: String(applicant._id)
    });

    sendSuccess(req, res, { applicant });
  })
);

admissionsRouter.post(
  '/applicants/:id/enroll',
  requirePermission('admissions', 'approve'),
  validateBody(
    z.object({
      initialFeeInr: z.number().min(0).default(165000),
      tempStudentPassword: z.string().min(8).default('StudentPass#2026')
    })
  ),
  asyncHandler(async (req, res) => {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Applicant not found');
    if (applicant.status !== 'approved') {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Application must be approved before student enrollment conversion'
      );
    }

    const dept = await Department.findById(applicant.departmentId).lean();
    const count = await Student.countDocuments();
    const studentCode = `STU-2026-${String(count + 1).padStart(4, '0')}`;
    const rollNumber = `26${(dept?.code || 'CAS').slice(0, 3)}${1000 + count + 1}`;

    let user = await User.findOne({ email: applicant.email });
    if (!user) {
      user = await User.create({
        email: applicant.email,
        name: applicant.fullName,
        phone: applicant.phone,
        passwordHash: await hashPassword(req.body.tempStudentPassword),
        status: 'active'
      });
      await RoleAssignment.create({
        userId: user._id,
        roleKey: 'STUDENT',
        scope: { departmentIds: [applicant.departmentId], programIds: [], subjectIds: [], hostelIds: [] },
        isPrimary: true,
        active: true
      });
    }

    const student = await Student.create({
      studentCode,
      rollNumber,
      userId: user._id,
      name: applicant.fullName,
      email: applicant.email,
      phone: applicant.phone,
      departmentId: applicant.departmentId,
      deptCode: dept?.code || 'GEN',
      programCode: applicant.programCode,
      semesterNumber: 1,
      batch: '2026 - 2030',
      guardianSummary: { name: applicant.guardianName, relation: 'Parent', phone: applicant.guardianPhone },
      totalFeeAssessedInr: req.body.initialFeeInr,
      paidFeeInr: 0,
      dueFeeInr: req.body.initialFeeInr,
      feeStatus: req.body.initialFeeInr > 0 ? 'Pending' : 'Paid'
    });

    user.linkedStudentId = student._id;
    await user.save();

    if (req.body.initialFeeInr > 0) {
      await Invoice.create({
        invoiceNo: `INV-2026-${String(Date.now()).slice(-6)}`,
        studentId: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        academicYear: '2026 - 2027',
        semesterLabel: 'Semester 1 (Admission)',
        feeHead: 'Admission & Tuition Fee',
        grossAmountInr: req.body.initialFeeInr,
        concessionInr: 0,
        netAmountInr: req.body.initialFeeInr,
        paidAmountInr: 0,
        dueAmountInr: req.body.initialFeeInr,
        dueDate: new Date(Date.now() + 15 * 86_400_000),
        status: 'Pending'
      });
    }

    applicant.status = 'enrolled';
    applicant.enrolledStudentId = student._id;
    await applicant.save();

    await recordAuditEvent({
      req,
      action: `Converted approved applicant ${applicant.applicationNo} to Student ${student.rollNumber}`,
      category: 'admissions',
      resourceType: 'Student',
      resourceId: String(student._id)
    });

    sendSuccess(req, res, { applicant, student }, 201);
  })
);

admissionsRouter.put(
  '/cms/:slug',
  requirePermission('cms', 'edit'),
  validateBody(
    z.object({
      title: z.string().trim().min(2),
      titleHi: z.string().trim().optional(),
      summary: z.string().trim().optional(),
      summaryHi: z.string().trim().optional(),
      body: z.string().trim().min(5),
      bodyHi: z.string().trim().optional(),
      published: z.boolean().default(true)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const slug = String(req.params.slug).toLowerCase();
    const page = await CmsPage.findOneAndUpdate(
      { slug },
      { $set: { ...req.body, slug, updatedByUserId: auth.userId } },
      { new: true, upsert: true }
    );
    await recordAuditEvent({
      req,
      action: `Updated public CMS page "${slug}"`,
      category: 'academic',
      resourceType: 'CmsPage',
      resourceId: slug
    });
    sendSuccess(req, res, { page });
  })
);
