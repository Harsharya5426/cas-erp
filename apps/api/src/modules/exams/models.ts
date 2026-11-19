import mongoose, { Schema } from 'mongoose';

const examScheduleSchema = new Schema(
  {
    examCode: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true },
    academicYear: { type: String, required: true },
    semesterNumber: { type: Number, required: true, min: 1, max: 12 },
    subjectCode: { type: String, required: true, uppercase: true },
    subjectName: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    examDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    room: { type: String, required: true },
    invigilatorName: { type: String, default: '' },
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 40 },
    state: {
      type: String,
      enum: ['scheduled', 'marks_open', 'verified', 'published'],
      default: 'marks_open'
    },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
export const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema);

const examMarkSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'ExamSchedule', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    subjectCode: { type: String, required: true, uppercase: true },
    credits: { type: Number, default: 4 },
    internalMarks: { type: Number, default: 0, min: 0, max: 50 },
    practicalMarks: { type: Number, default: 0, min: 0, max: 50 },
    externalMarks: { type: Number, default: 0, min: 0, max: 100 },
    totalMarks: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true },
    moderationStatus: {
      type: String,
      enum: ['submitted', 'verified', 'published_locked'],
      default: 'submitted'
    },
    submittedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true, versionKey: false }
);
examMarkSchema.index({ examId: 1, studentId: 1 }, { unique: true });
export const ExamMark = mongoose.model('ExamMark', examMarkSchema);

const publishedResultSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    rollNumber: { type: String, required: true },
    academicYear: { type: String, required: true },
    semesterNumber: { type: Number, required: true },
    subjects: [
      {
        _id: false,
        subjectCode: String,
        subjectName: String,
        credits: Number,
        totalMarks: Number,
        grade: String
      }
    ],
    sgpa: { type: Number, required: true },
    cgpa: { type: Number, required: true },
    earnedCredits: { type: Number, required: true },
    totalCredits: { type: Number, required: true },
    backlogCount: { type: Number, default: 0 },
    auditLockHash: { type: String, required: true },
    publishedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true, versionKey: false }
);
publishedResultSchema.index({ studentId: 1, academicYear: 1, semesterNumber: 1 }, { unique: true });
export const PublishedResult = mongoose.model('PublishedResult', publishedResultSchema);

const revaluationRequestSchema = new Schema(
  {
    resultId: { type: Schema.Types.ObjectId, ref: 'PublishedResult', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectCode: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'no_change', 'rejected'], default: 'pending' },
    reviewedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);
export const RevaluationRequest = mongoose.model('RevaluationRequest', revaluationRequestSchema);

const lmsMaterialSchema = new Schema(
  {
    subjectCode: { type: String, required: true, uppercase: true },
    title: { type: String, required: true },
    materialType: { type: String, enum: ['notes', 'syllabus', 'assignment'], default: 'notes' },
    description: { type: String, default: '' },
    dueDate: { type: Date, default: null },
    maxScore: { type: Number, default: 20 },
    fileObjectKey: { type: String, default: '' },
    originalFileName: { type: String, default: '' },
    uploadedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedByName: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);
lmsMaterialSchema.index({ subjectCode: 1, createdAt: -1 });
export const LmsMaterial = mongoose.model('LmsMaterial', lmsMaterialSchema);

const assignmentSubmissionSchema = new Schema(
  {
    materialId: { type: Schema.Types.ObjectId, ref: 'LmsMaterial', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    notes: { type: String, default: '' },
    fileObjectKey: { type: String, default: '' },
    originalFileName: { type: String, default: '' },
    marksAwarded: { type: Number, default: null },
    feedback: { type: String, default: '' },
    gradedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    submittedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true, versionKey: false }
);
assignmentSubmissionSchema.index({ materialId: 1, studentId: 1 }, { unique: true });
export const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);

