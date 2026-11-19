import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AKTU_GRADE_POINTS, ERROR_CODES, calculateSGPA } from '@cas-erp/shared';
import { readPrivateObject, storePrivateObject } from '../../adapters/storage.js';
import { recordAuditEvent } from '../../core/audit.js';
import { sha256Hex } from '../../core/crypto.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import { type AuthenticatedRequest, requireAuth, requirePermission } from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { GuardianLink, Student } from '../academics/models.js';
import { Department, InstitutionSettings, Subject } from '../org/models.js';
import {
  AssignmentSubmission,
  ExamMark,
  ExamSchedule,
  LmsMaterial,
  PublishedResult,
  RevaluationRequest
} from './models.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function marksToGrade(total: number): string {
  if (total >= 90) return 'O';
  if (total >= 80) return 'A+';
  if (total >= 70) return 'A';
  if (total >= 60) return 'B+';
  if (total >= 50) return 'B';
  if (total >= 45) return 'C';
  if (total >= 40) return 'P';
  return 'F';
}

export const examsRouter = Router();
examsRouter.use(requireAuth);

// ============================================================================
// Examinations, Marks Moderation & Audit-Locked Result Publication (FM-10)
// ============================================================================
examsRouter.get(
  '/schedules',
  requirePermission('exams', 'view'),
  asyncHandler(async (req, res) => {
    const schedules = await ExamSchedule.find()
      .populate('departmentId', 'code name')
      .sort({ examDate: 1 })
      .lean();
    sendSuccess(req, res, { schedules });
  })
);

examsRouter.post(
  '/schedules',
  requirePermission('exams', 'create'),
  validateBody(
    z.object({
      examCode: z.string().trim().min(3),
      title: z.string().trim().min(3),
      academicYear: z.string().default('2026 - 2027'),
      semesterNumber: z.number().int().min(1).max(12),
      subjectCode: z.string().trim().min(2),
      deptCode: z.string().trim().min(2),
      examDate: z.string(),
      slotTime: z.string(),
      room: z.string()
    })
  ),
  asyncHandler(async (req, res) => {
    const dept = await Department.findOne({ code: req.body.deptCode.toUpperCase() }).lean();
    if (!dept) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Department not found');
    const subject = await Subject.findOne({ code: req.body.subjectCode.toUpperCase() }).lean();

    const schedule = await ExamSchedule.create({
      ...req.body,
      examCode: req.body.examCode.toUpperCase(),
      subjectCode: req.body.subjectCode.toUpperCase(),
      subjectName: subject?.name || req.body.subjectCode,
      departmentId: dept._id,
      state: 'marks_open'
    });
    await recordAuditEvent({
      req,
      action: `Created exam schedule ${schedule.examCode}`,
      category: 'exams',
      resourceType: 'ExamSchedule',
      resourceId: String(schedule._id)
    });
    sendSuccess(req, res, { schedule }, 201);
  })
);

examsRouter.get(
  '/marks',
  requirePermission('exams', 'view'),
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.examId) filter.examId = req.query.examId;
    if (req.query.subjectCode) filter.subjectCode = String(req.query.subjectCode).toUpperCase();
    const marks = await ExamMark.find(filter).sort({ rollNumber: 1 }).lean();
    sendSuccess(req, res, { marks });
  })
);

examsRouter.put(
  '/marks',
  requirePermission('exams', 'edit'),
  validateBody(
    z.object({
      examId: z.string().min(10),
      studentId: z.string().min(10),
      internalMarks: z.number().min(0).max(50).default(0),
      practicalMarks: z.number().min(0).max(50).default(0),
      externalMarks: z.number().min(0).max(100).default(0)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const exam = await ExamSchedule.findById(req.body.examId);
    const student = await Student.findById(req.body.studentId);
    if (!exam || !student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Exam or student not found');
    if (exam.state === 'published') {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Published exam marks are audit-locked and immutable');
    }

    const totalMarks = Math.min(
      100,
      req.body.internalMarks + req.body.practicalMarks + req.body.externalMarks
    );
    const grade = marksToGrade(totalMarks);
    const subject = await Subject.findOne({ code: exam.subjectCode }).lean();

    const mark = await ExamMark.findOneAndUpdate(
      { examId: exam._id, studentId: student._id },
      {
        $set: {
          studentName: student.name,
          rollNumber: student.rollNumber,
          subjectCode: exam.subjectCode,
          credits: subject?.credits ?? 4,
          internalMarks: req.body.internalMarks,
          practicalMarks: req.body.practicalMarks,
          externalMarks: req.body.externalMarks,
          totalMarks,
          grade,
          moderationStatus: 'submitted',
          submittedByUserId: auth.userId
        }
      },
      { upsert: true, new: true }
    );

    await recordAuditEvent({
      req,
      action: `Submitted marks (${totalMarks}, ${grade}) for ${student.rollNumber} in ${exam.subjectCode}`,
      category: 'exams',
      resourceType: 'ExamMark',
      resourceId: String(mark._id)
    });

    sendSuccess(req, res, { mark });
  })
);

examsRouter.post(
  '/schedules/:id/verify',
  requirePermission('exams', 'approve'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const exam = await ExamSchedule.findById(req.params.id);
    if (!exam) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Exam schedule not found');

    const marks = await ExamMark.find({ examId: exam._id });
    if (marks.length === 0) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Cannot verify exam with zero marks entered');
    }

    // SoD: verifier cannot be the faculty submitter for all marks
    const selfSubmitted = marks.every((m) => String(m.submittedByUserId) === auth.userId);
    if (selfSubmitted && auth.activeRole === 'FACULTY') {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Segregation of duties: faculty cannot self-verify marks');
    }

    await ExamMark.updateMany(
      { examId: exam._id },
      { $set: { moderationStatus: 'verified', verifiedByUserId: auth.userId } }
    );
    exam.state = 'verified';
    exam.verifiedByUserId = auth.userId as never;
    await exam.save();

    await recordAuditEvent({
      req,
      action: `Verified exam marks for ${exam.examCode}`,
      category: 'exams',
      resourceType: 'ExamSchedule',
      resourceId: String(exam._id)
    });

    sendSuccess(req, res, { exam });
  })
);

examsRouter.post(
  '/schedules/:id/publish',
  requirePermission('exams', 'publish'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const exam = await ExamSchedule.findById(req.params.id);
    if (!exam) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Exam schedule not found');
    if (exam.state !== 'verified') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Exam marks must be verified before publication');
    }

    const marks = await ExamMark.find({ examId: exam._id });
    await ExamMark.updateMany({ examId: exam._id }, { $set: { moderationStatus: 'published_locked' } });
    exam.state = 'published';
    exam.publishedByUserId = auth.userId as never;
    exam.publishedAt = new Date();
    await exam.save();

    for (const m of marks) {
      const studentMarks = await ExamMark.find({
        studentId: m.studentId,
        moderationStatus: 'published_locked'
      }).lean();
      const { sgpa, totalCredits, earnedCredits } = calculateSGPA(
        studentMarks.map((sm) => ({ credits: sm.credits, grade: sm.grade }))
      );
      const backlogCount = studentMarks.filter((sm) => (AKTU_GRADE_POINTS[sm.grade] ?? 0) === 0).length;

      const subjectsPayload = studentMarks.map((sm) => ({
        subjectCode: sm.subjectCode,
        subjectName: sm.subjectCode,
        credits: sm.credits,
        totalMarks: sm.totalMarks,
        grade: sm.grade
      }));

      await PublishedResult.findOneAndUpdate(
        {
          studentId: m.studentId,
          academicYear: exam.academicYear,
          semesterNumber: exam.semesterNumber
        },
        {
          $set: {
            rollNumber: m.rollNumber,
            subjects: subjectsPayload,
            sgpa,
            cgpa: sgpa,
            earnedCredits,
            totalCredits,
            backlogCount,
            auditLockHash: sha256Hex(JSON.stringify(subjectsPayload)),
            publishedByUserId: auth.userId,
            publishedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );

      await Student.findByIdAndUpdate(m.studentId, { $set: { cgpa: sgpa } });
    }

    await recordAuditEvent({
      req,
      action: `Published audit-locked results for ${exam.examCode} (${marks.length} students)`,
      category: 'exams',
      resourceType: 'ExamSchedule',
      resourceId: String(exam._id)
    });

    sendSuccess(req, res, { exam, publishedStudents: marks.length });
  })
);

examsRouter.get(
  '/results',
  requirePermission('exams', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter: Record<string, unknown> = {};
    if (scope === 'own' && auth.linkedStudentId) {
      filter.studentId = auth.linkedStudentId;
    } else if (scope === 'linked-student') {
      const links = await GuardianLink.find({
        guardianUserId: auth.userId,
        verificationStatus: 'verified'
      }).lean();
      filter.studentId = { $in: links.map((l) => l.studentId) };
    }
    const results = await PublishedResult.find(filter).sort({ publishedAt: -1 }).lean();
    sendSuccess(req, res, { results });
  })
);

examsRouter.get(
  '/admit-card-eligibility/:studentId',
  requirePermission('exams', 'view'),
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.studentId).lean();
    if (!student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student not found');
    const settings = await InstitutionSettings.findOne({ singletonKey: 'CAS_PRIMARY' }).lean();
    const minAtt = settings?.aktuConfig?.admitCardMinAttendancePct ?? 75;
    const eligible = student.attendancePct >= minAtt && student.dueFeeInr <= 0;
    sendSuccess(req, res, {
      studentId: student._id,
      rollNumber: student.rollNumber,
      attendancePct: student.attendancePct,
      minAttendanceRequiredPct: minAtt,
      dueFeeInr: student.dueFeeInr,
      eligible
    });
  })
);

examsRouter.post(
  '/revaluation',
  requirePermission('exams', 'submit'),
  validateBody(
    z.object({
      resultId: z.string().min(10),
      subjectCode: z.string().min(2),
      reason: z.string().min(5)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const result = await PublishedResult.findById(req.body.resultId);
    if (!result) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Published result not found');

    const reqDoc = await RevaluationRequest.create({
      resultId: result._id,
      studentId: result.studentId,
      subjectCode: req.body.subjectCode.toUpperCase(),
      reason: req.body.reason
    });
    await recordAuditEvent({
      req,
      action: `Submitted revaluation request for ${req.body.subjectCode.toUpperCase()}`,
      category: 'exams',
      resourceType: 'RevaluationRequest',
      resourceId: String(reqDoc._id),
      metadata: { requestedBy: auth.userId }
    });
    sendSuccess(req, res, { revaluationRequest: reqDoc }, 201);
  })
);

// ============================================================================
// Basic LMS: Materials, Assignments & Submissions (FM-21)
// ============================================================================
examsRouter.get(
  '/lms/materials',
  requirePermission('lms', 'view'),
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.subjectCode) filter.subjectCode = String(req.query.subjectCode).toUpperCase();
    const materials = await LmsMaterial.find(filter).sort({ createdAt: -1 }).lean();
    sendSuccess(req, res, { materials });
  })
);

examsRouter.post(
  '/lms/materials',
  requirePermission('lms', 'create'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const subjectCode = String(req.body.subjectCode || '').toUpperCase().trim();
    const title = String(req.body.title || '').trim();
    if (!subjectCode || !title) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'subjectCode and title are required');
    }

    let fileObjectKey = '';
    let originalFileName = '';
    if (req.file) {
      const stored = await storePrivateObject({
        folder: `lms/${subjectCode}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        buffer: req.file.buffer
      });
      fileObjectKey = stored.objectKey;
      originalFileName = req.file.originalname;
    }

    const material = await LmsMaterial.create({
      subjectCode,
      title,
      materialType: req.body.materialType || 'notes',
      description: req.body.description || '',
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      maxScore: Number(req.body.maxScore) || 20,
      fileObjectKey,
      originalFileName,
      uploadedByUserId: auth.userId,
      uploadedByName: auth.name
    });

    sendSuccess(req, res, { material }, 201);
  })
);

examsRouter.get(
  '/lms/materials/:id/download',
  requirePermission('lms', 'view'),
  asyncHandler(async (req, res) => {
    const material = await LmsMaterial.findById(req.params.id).lean();
    if (!material || !material.fileObjectKey) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Attachment not found');
    }
    const obj = await readPrivateObject(material.fileObjectKey);
    if (obj.signedUrl) {
      sendSuccess(req, res, { signedUrl: obj.signedUrl });
      return;
    }
    res.setHeader('Content-Disposition', `attachment; filename="${material.originalFileName || 'resource'}"`);
    res.send(obj.buffer);
  })
);

examsRouter.get(
  '/lms/submissions',
  requirePermission('lms', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter: Record<string, unknown> = {};
    if (req.query.materialId) filter.materialId = req.query.materialId;
    if (scope === 'own' && auth.linkedStudentId) filter.studentId = auth.linkedStudentId;
    const submissions = await AssignmentSubmission.find(filter).sort({ submittedAt: -1 }).lean();
    sendSuccess(req, res, { submissions });
  })
);

examsRouter.post(
  '/lms/submissions',
  requirePermission('lms', 'submit'),
  validateBody(z.object({ materialId: z.string().min(10), notes: z.string().min(2) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const student = auth.linkedStudentId
      ? await Student.findById(auth.linkedStudentId).lean()
      : await Student.findOne({ userId: auth.userId }).lean();
    if (!student) throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Student profile required');

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { materialId: req.body.materialId, studentId: student._id },
      {
        $set: {
          studentName: student.name,
          notes: req.body.notes,
          submittedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    sendSuccess(req, res, { submission }, 201);
  })
);

examsRouter.post(
  '/lms/submissions/:id/grade',
  requirePermission('lms', 'edit'),
  validateBody(z.object({ marksAwarded: z.number().min(0), feedback: z.string().trim().min(1) })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const sub = await AssignmentSubmission.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          marksAwarded: req.body.marksAwarded,
          feedback: req.body.feedback,
          gradedByUserId: auth.userId
        }
      },
      { new: true }
    );
    if (!sub) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Submission not found');
    sendSuccess(req, res, { submission: sub });
  })
);

