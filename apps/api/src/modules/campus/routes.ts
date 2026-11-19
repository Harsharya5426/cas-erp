import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ERROR_CODES } from '@cas-erp/shared';
import { storePrivateObject } from '../../adapters/storage.js';
import { recordAuditEvent } from '../../core/audit.js';
import { generateOpaqueToken } from '../../core/crypto.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import { type AuthenticatedRequest, requireAuth, requirePermission } from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { assertWorkflowStepAuthority } from '../../core/workflow.js';
import { Student } from '../academics/models.js';
import {
  AlumniProfile,
  BedAllocation,
  CampusEvent,
  CertificateRecord,
  CirculationRecord,
  DocumentRecord,
  GrievanceTicket,
  Hostel,
  InventoryAsset,
  LibraryItem,
  PlacementDrive,
  ProcurementRequest,
  ResearchProject,
  SafetyIncident,
  VisitorLog
} from './models.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const campusRouter = Router();
campusRouter.use(requireAuth);

// ============================================================================
// Library (FM-12)
// ============================================================================
campusRouter.get(
  '/library/items',
  requirePermission('library', 'view'),
  asyncHandler(async (req, res) => {
    const items = await LibraryItem.find().sort({ title: 1 }).lean();
    const circulations = await CirculationRecord.find().sort({ createdAt: -1 }).limit(50).lean();
    sendSuccess(req, res, { items, circulations });
  })
);

campusRouter.post(
  '/library/items',
  requirePermission('library', 'create'),
  validateBody(
    z.object({
      isbn: z.string().min(4),
      barcode: z.string().min(3),
      title: z.string().min(2),
      author: z.string().min(2),
      publisher: z.string().optional(),
      category: z.string().default('Engineering'),
      totalCopies: z.number().int().min(1).default(1),
      resourceType: z.enum(['Physical', 'Digital']).default('Physical')
    })
  ),
  asyncHandler(async (req, res) => {
    const item = await LibraryItem.create({
      ...req.body,
      availableCopies: req.body.totalCopies
    });
    sendSuccess(req, res, { item }, 201);
  })
);

campusRouter.post(
  '/library/issue',
  requirePermission('library', 'edit'),
  validateBody(z.object({ itemId: z.string().min(10), borrowerUserId: z.string().min(10), borrowerName: z.string().min(2), days: z.number().int().min(1).max(60).default(14) })),
  asyncHandler(async (req, res) => {
    const item = await LibraryItem.findById(req.body.itemId);
    if (!item || item.availableCopies <= 0) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'No copies available for issue');
    }
    item.availableCopies -= 1;
    await item.save();

    const record = await CirculationRecord.create({
      itemId: item._id,
      itemTitle: item.title,
      borrowerUserId: req.body.borrowerUserId,
      borrowerName: req.body.borrowerName,
      dueDate: new Date(Date.now() + req.body.days * 86_400_000),
      status: 'issued'
    });
    sendSuccess(req, res, { record }, 201);
  })
);

campusRouter.post(
  '/library/return/:recordId',
  requirePermission('library', 'edit'),
  asyncHandler(async (req, res) => {
    const record = await CirculationRecord.findById(req.params.recordId);
    if (!record || record.status === 'returned') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Active circulation record not found');
    }
    const now = new Date();
    const overdueDays = Math.max(0, Math.floor((now.getTime() - record.dueDate.getTime()) / 86_400_000));
    record.returnedAt = now;
    record.fineInr = overdueDays * 5; // ₹5/day configurable fine
    record.status = 'returned';
    await record.save();

    await LibraryItem.findByIdAndUpdate(record.itemId, { $inc: { availableCopies: 1 } });
    sendSuccess(req, res, { record });
  })
);

// ============================================================================
// Hostel & Mess (FM-13)
// ============================================================================
campusRouter.get(
  '/hostels',
  requirePermission('hostel', 'view'),
  asyncHandler(async (req, res) => {
    const hostels = await Hostel.find().sort({ code: 1 }).lean();
    const allocations = await BedAllocation.find().sort({ createdAt: -1 }).limit(100).lean();
    sendSuccess(req, res, { hostels, allocations });
  })
);

campusRouter.post(
  '/hostels/allocate',
  requirePermission('hostel', 'approve'),
  validateBody(
    z.object({
      hostelId: z.string().min(10),
      studentId: z.string().min(10),
      roomNumber: z.string().min(1),
      bedNumber: z.string().min(1)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const hostel = await Hostel.findById(req.body.hostelId).lean();
    const student = await Student.findById(req.body.studentId).lean();
    if (!hostel || !student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Hostel or student not found');

    const allocation = await BedAllocation.create({
      hostelId: hostel._id,
      hostelName: hostel.name,
      roomNumber: req.body.roomNumber,
      bedNumber: req.body.bedNumber,
      studentId: student._id,
      studentName: student.name,
      status: 'allocated',
      allocatedByUserId: auth.userId
    });
    await recordAuditEvent({
      req,
      action: `Allocated hostel bed ${hostel.code} ${req.body.roomNumber}-${req.body.bedNumber} to ${student.rollNumber}`,
      category: 'campus',
      resourceType: 'BedAllocation',
      resourceId: String(allocation._id)
    });
    sendSuccess(req, res, { allocation }, 201);
  })
);

// ============================================================================
// Documents & Verifiable QR Certificates (FM-15)
// ============================================================================
campusRouter.get(
  '/documents',
  requirePermission('documents', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter = scope === 'own' ? { ownerUserId: auth.userId } : {};
    const documents = await DocumentRecord.find(filter).sort({ createdAt: -1 }).lean();
    sendSuccess(req, res, { documents });
  })
);

campusRouter.post(
  '/documents',
  requirePermission('documents', 'create'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    if (!req.file) throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'File is required');
    const stored = await storePrivateObject({
      folder: `documents/${auth.userId}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer
    });

    const doc = await DocumentRecord.create({
      ownerUserId: auth.userId,
      ownerName: auth.name,
      category: req.body.category || 'Academic',
      title: String(req.body.title || req.file.originalname),
      objectKey: stored.objectKey,
      sha256: stored.sha256,
      mimeType: stored.mimeType,
      malwareScanStatus: stored.malwareScanStatus
    });
    sendSuccess(req, res, { document: doc }, 201);
  })
);

campusRouter.get(
  '/certificates',
  requirePermission('certificates', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter = scope === 'own' && auth.linkedStudentId ? { studentId: auth.linkedStudentId } : {};
    const certificates = await CertificateRecord.find(filter).sort({ createdAt: -1 }).lean();
    sendSuccess(req, res, { certificates });
  })
);

campusRouter.post(
  '/certificates/request',
  requirePermission('certificates', 'create'),
  validateBody(
    z.object({
      studentId: z.string().optional(),
      certificateType: z.string().min(3),
      purpose: z.string().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const student = req.body.studentId
      ? await Student.findById(req.body.studentId).lean()
      : auth.linkedStudentId
      ? await Student.findById(auth.linkedStudentId).lean()
      : await Student.findOne({ userId: auth.userId }).lean();
    if (!student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student profile required');

    const cert = await CertificateRecord.create({
      serialNo: `CERT-CAS-${Date.now().toString().slice(-6)}`,
      studentId: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      certificateType: req.body.certificateType,
      purpose: req.body.purpose || '',
      qrVerificationToken: generateOpaqueToken(12)
    });
    sendSuccess(req, res, { certificate: cert }, 201);
  })
);

campusRouter.post(
  '/certificates/:id/sign',
  requirePermission('certificates', 'approve'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const cert = await CertificateRecord.findById(req.params.id);
    if (!cert) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Certificate not found');
    await assertWorkflowStepAuthority('certificates', 2, auth.userId, auth.activeRole);

    cert.status = 'signed_issued';
    cert.signedByUserId = auth.userId as never;
    cert.signedByName = auth.name;
    cert.issuedAt = new Date();
    await cert.save();

    await recordAuditEvent({
      req,
      action: `Digitally signed & issued ${cert.certificateType} certificate ${cert.serialNo}`,
      category: 'academic',
      resourceType: 'CertificateRecord',
      resourceId: String(cert._id)
    });
    sendSuccess(req, res, { certificate: cert });
  })
);

// ============================================================================
// Confidential Grievance & Helpdesk (FM-19 — Strict Access Isolation!)
// ============================================================================
campusRouter.get(
  '/grievances',
  requirePermission('grievances', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;

    const filter: Record<string, unknown> = {};
    if (scope === 'own') {
      filter.submittedByUserId = auth.userId;
    } else if (scope === 'pool-assigned') {
      // Strictly isolate confidential grievances to explicit assignee or Principal
      if (auth.activeRole === 'PRINCIPAL') {
        filter.$or = [{ confidential: false }, { assignedToUserId: auth.userId }, { assignedPool: 'CONFIDENTIAL_COMMITTEE' }];
      } else {
        filter.$or = [{ confidential: false }, { assignedToUserId: auth.userId }];
      }
    }

    const tickets = await GrievanceTicket.find(filter).sort({ createdAt: -1 }).lean();
    sendSuccess(req, res, { tickets });
  })
);

campusRouter.post(
  '/grievances',
  requirePermission('grievances', 'create'),
  validateBody(
    z.object({
      category: z.string().min(2),
      subject: z.string().min(4),
      description: z.string().min(10),
      confidential: z.boolean().default(false)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const ticket = await GrievanceTicket.create({
      ticketNo: `GRV-${Date.now().toString().slice(-6)}`,
      submittedByUserId: auth.userId,
      category: req.body.category,
      subject: req.body.subject,
      description: req.body.description,
      confidential: req.body.confidential,
      assignedPool: req.body.confidential ? 'CONFIDENTIAL_COMMITTEE' : 'ADMIN_HELPDESK',
      slaDueAt: new Date(Date.now() + 72 * 3_600_000)
    });

    await recordAuditEvent({
      req,
      action: `Submitted grievance ticket ${ticket.ticketNo} (confidential=${ticket.confidential})`,
      category: 'grievance',
      resourceType: 'GrievanceTicket',
      resourceId: String(ticket._id)
    });
    sendSuccess(req, res, { ticket }, 201);
  })
);

campusRouter.patch(
  '/grievances/:id',
  requirePermission('grievances', 'edit'),
  validateBody(
    z.object({
      status: z.enum(['in_review', 'escalated', 'resolved', 'closed']),
      resolutionNotes: z.string().min(3)
    })
  ),
  asyncHandler(async (req, res) => {
    const ticket = await GrievanceTicket.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!ticket) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Ticket not found');
    await recordAuditEvent({
      req,
      action: `Updated grievance ${ticket.ticketNo} -> ${ticket.status}`,
      category: 'grievance',
      resourceType: 'GrievanceTicket',
      resourceId: String(ticket._id)
    });
    sendSuccess(req, res, { ticket });
  })
);

// ============================================================================
// Placement, Alumni, Inventory/Procurement, Events, Research, Safety/Visitor
// ============================================================================
campusRouter.get(
  '/placements',
  requirePermission('placement', 'view'),
  asyncHandler(async (req, res) => {
    const drives = await PlacementDrive.find().sort({ driveDate: 1 }).lean();
    const alumni = await AlumniProfile.find({ directoryVisible: true }).sort({ graduationYear: -1 }).lean();
    sendSuccess(req, res, { drives, alumni });
  })
);

campusRouter.post(
  '/placements/drives',
  requirePermission('placement', 'create'),
  validateBody(
    z.object({
      driveCode: z.string().min(3),
      companyName: z.string().min(2),
      roleTitle: z.string().min(2),
      packageLpa: z.number().positive(),
      minCgpa: z.number().min(0).max(10).default(6.5),
      driveDate: z.string()
    })
  ),
  asyncHandler(async (req, res) => {
    const drive = await PlacementDrive.create(req.body);
    sendSuccess(req, res, { drive }, 201);
  })
);

campusRouter.post(
  '/placements/drives/:id/apply',
  requirePermission('placement', 'submit'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Placement drive not found');
    const student = auth.linkedStudentId
      ? await Student.findById(auth.linkedStudentId).lean()
      : await Student.findOne({ userId: auth.userId }).lean();
    if (!student) throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Student profile required');
    if (student.cgpa < drive.minCgpa) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, `Minimum CGPA ${drive.minCgpa} required`);
    }
    const already = drive.applicants.some((a) => String(a.studentId) === String(student._id));
    if (!already) {
      drive.applicants.push({
        studentId: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        status: 'applied'
      });
      await drive.save();
    }
    sendSuccess(req, res, { drive });
  })
);

campusRouter.get(
  '/inventory',
  requirePermission('inventory', 'view'),
  asyncHandler(async (req, res) => {
    const [assets, procurements] = await Promise.all([
      InventoryAsset.find().sort({ createdAt: -1 }).lean(),
      ProcurementRequest.find().sort({ createdAt: -1 }).lean()
    ]);
    sendSuccess(req, res, { assets, procurements });
  })
);

campusRouter.post(
  '/inventory/assets',
  requirePermission('inventory', 'create'),
  validateBody(
    z.object({
      assetTag: z.string().min(3),
      name: z.string().min(2),
      category: z.string().min(2),
      departmentCode: z.string().min(2),
      quantity: z.number().int().min(1).default(1),
      unitCostInr: z.number().min(0).default(0),
      vendorName: z.string().optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const asset = await InventoryAsset.create(req.body);
    sendSuccess(req, res, { asset }, 201);
  })
);

campusRouter.post(
  '/inventory/procurements',
  requirePermission('inventory', 'create'),
  validateBody(
    z.object({
      itemName: z.string().min(2),
      quantity: z.number().int().min(1),
      estimatedCostInr: z.number().positive(),
      departmentCode: z.string().min(2)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const pr = await ProcurementRequest.create({
      requestNo: `PR-${Date.now().toString().slice(-6)}`,
      ...req.body,
      requestedByUserId: auth.userId
    });
    sendSuccess(req, res, { procurement: pr }, 201);
  })
);

campusRouter.get(
  '/operations-hub',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [events, research, visitors, incidents] = await Promise.all([
      CampusEvent.find().sort({ eventDate: 1 }).lean(),
      ResearchProject.find().sort({ createdAt: -1 }).lean(),
      VisitorLog.find().sort({ entryAt: -1 }).limit(30).lean(),
      SafetyIncident.find().sort({ createdAt: -1 }).limit(30).lean()
    ]);
    sendSuccess(req, res, { events, research, visitors, incidents });
  })
);

campusRouter.post(
  '/operations/events',
  requirePermission('events', 'create'),
  validateBody(
    z.object({
      title: z.string().min(3),
      category: z.enum(['Academic', 'Cultural', 'Sports', 'Club', 'Workshop']),
      eventDate: z.string(),
      venue: z.string().min(2),
      budgetInr: z.number().min(0).default(0)
    })
  ),
  asyncHandler(async (req, res) => {
    const event = await CampusEvent.create({
      eventCode: `EVT-${Date.now().toString().slice(-6)}`,
      ...req.body
    });
    sendSuccess(req, res, { event }, 201);
  })
);

campusRouter.post(
  '/operations/research',
  requirePermission('research', 'create'),
  validateBody(
    z.object({
      title: z.string().min(3),
      principalInvestigator: z.string().min(2),
      fundingAgency: z.string().default('SERB / Institutional Seed Grant'),
      grantAmountInr: z.number().min(0).default(0)
    })
  ),
  asyncHandler(async (req, res) => {
    const project = await ResearchProject.create({
      projectCode: `RES-${Date.now().toString().slice(-6)}`,
      ...req.body
    });
    sendSuccess(req, res, { project }, 201);
  })
);

campusRouter.post(
  '/operations/visitors',
  requirePermission('safety', 'create'),
  validateBody(
    z.object({
      visitorName: z.string().min(2),
      contactPhone: z.string().min(10),
      purpose: z.string().min(3),
      hostName: z.string().min(2)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const visitor = await VisitorLog.create({
      ...req.body,
      recordedByUserId: auth.userId
    });
    sendSuccess(req, res, { visitor }, 201);
  })
);

