import mongoose, { Schema } from 'mongoose';

const cmsPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    titleHi: { type: String, default: '' },
    summary: { type: String, default: '' },
    summaryHi: { type: String, default: '' },
    body: { type: String, required: true },
    bodyHi: { type: String, default: '' },
    published: { type: Boolean, default: true },
    updatedByUserId: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true, versionKey: false }
);
export const CmsPage = mongoose.model('CmsPage', cmsPageSchema);

const applicantSchema = new Schema(
  {
    applicationNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    trackingPinHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    programCode: { type: String, required: true, uppercase: true },
    qualifyingExamName: { type: String, required: true },
    qualifyingScorePct: { type: Number, required: true, min: 0, max: 100 },
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    documents: [
      {
        _id: false,
        label: String,
        objectKey: String,
        sha256: String,
        mimeType: String,
        malwareScanStatus: String,
        verified: { type: Boolean, default: false }
      }
    ],
    status: {
      type: String,
      enum: ['submitted', 'docs_verified', 'merit_shortlisted', 'approved', 'rejected', 'enrolled'],
      default: 'submitted'
    },
    remarks: { type: String, default: '' },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    enrolledStudentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null }
  },
  { timestamps: true, versionKey: false }
);
applicantSchema.index({ status: 1, departmentId: 1 });
export const Applicant = mongoose.model('Applicant', applicantSchema);
