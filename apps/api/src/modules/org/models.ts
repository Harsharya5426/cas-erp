import mongoose, { Schema } from 'mongoose';

export interface IInstitutionSettings {
  singletonKey: string;
  institutionName: string;
  institutionNameHi: string;
  affiliation: string;
  campusAddress: string;
  domain: string;
  activeAcademicYear: string;
  activeSemesterLabel: string;
  regulatoryCode: string;
  treasuryEmail: string;
  currency: 'INR';
  timezone: 'Asia/Kolkata';
  dateFormat: 'DD-MM-YYYY';
  attendanceShortageThresholdPct: number;
  aktuConfig: {
    version: string;
    passingCGPA: number;
    maxBacklogsAllowedForPromotion: number;
    admitCardMinAttendancePct: number;
  };
  biometrics: {
    privacyAssessmentApproved: boolean;
    faceMatchingEnabled: boolean;
    nonBiometricAlternativeRequired: boolean;
    retentionDays: number;
    consentNoticeVersion: string;
  };
  aiGovernance: {
    enabled: boolean;
    advisoryOnlyEnforced: boolean;
    requireHumanReviewForActions: boolean;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
  };
}

const institutionSettingsSchema = new Schema<IInstitutionSettings>(
  {
    singletonKey: { type: String, default: 'CAS_PRIMARY', unique: true },
    institutionName: { type: String, required: true },
    institutionNameHi: { type: String, required: true },
    affiliation: { type: String, required: true },
    campusAddress: { type: String, required: true },
    domain: { type: String, default: 'cas.res.in' },
    activeAcademicYear: { type: String, required: true },
    activeSemesterLabel: { type: String, required: true },
    regulatoryCode: { type: String, default: '' },
    treasuryEmail: { type: String, default: 'accounts@cas.res.in' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD-MM-YYYY' },
    attendanceShortageThresholdPct: { type: Number, default: 75, min: 0, max: 100 },
    aktuConfig: {
      version: { type: String, default: 'AKTU-CBCS-v1' },
      passingCGPA: { type: Number, default: 5.0 },
      maxBacklogsAllowedForPromotion: { type: Number, default: 4 },
      admitCardMinAttendancePct: { type: Number, default: 75 }
    },
    biometrics: {
      privacyAssessmentApproved: { type: Boolean, default: false },
      faceMatchingEnabled: { type: Boolean, default: false },
      nonBiometricAlternativeRequired: { type: Boolean, default: true },
      retentionDays: { type: Number, default: 365 },
      consentNoticeVersion: { type: String, default: 'v1.0-draft' }
    },
    aiGovernance: {
      enabled: { type: Boolean, default: true },
      advisoryOnlyEnforced: { type: Boolean, default: true },
      requireHumanReviewForActions: { type: Boolean, default: true }
    },
    branding: {
      primaryColor: { type: String, default: '#3587A4' },
      secondaryColor: { type: String, default: '#2D898B' },
      logoUrl: { type: String, default: '/cas-logo.png' }
    }
  },
  { timestamps: true, versionKey: false }
);

export const InstitutionSettings = mongoose.model<IInstitutionSettings>(
  'InstitutionSettings',
  institutionSettingsSchema
);

export const departmentSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, default: '' },
    hodName: { type: String, default: '' },
    hodUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    annualBudgetInr: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    isSyntheticPlaceholder: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);
export const Department = mongoose.model('Department', departmentSchema);

const programSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    programType: { type: String, enum: ['UG', 'PG', 'PhD', 'Diploma', 'Certificate'], required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    durationSemesters: { type: Number, required: true, min: 1, max: 12 },
    totalCredits: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
    isSyntheticPlaceholder: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);
export const Program = mongoose.model('Program', programSchema);

const academicSessionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);
export const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);

const subjectSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, default: '' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    semesterNumber: { type: Number, required: true, min: 1, max: 12 },
    credits: { type: Number, required: true, min: 0, max: 20 },
    subjectType: { type: String, enum: ['Theory', 'Practical', 'Project', 'Audit'], default: 'Theory' },
    syllabusProgressPct: { type: Number, default: 0, min: 0, max: 100 },
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    facultyName: { type: String, default: '' },
    active: { type: Boolean, default: true },
    isSyntheticPlaceholder: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);
subjectSchema.index({ departmentId: 1, semesterNumber: 1 });
export const Subject = mongoose.model('Subject', subjectSchema);

const migrationBatchSchema = new Schema(
  {
    sourceSystem: { type: String, required: true },
    entityType: { type: String, enum: ['students', 'departments', 'subjects', 'fees'], required: true },
    mode: { type: String, enum: ['dry_run', 'committed'], required: true },
    fileChecksumSha256: { type: String, required: true },
    totalRows: { type: Number, required: true },
    validRows: { type: Number, required: true },
    rejectedRows: { type: Number, required: true },
    rejections: [
      {
        _id: false,
        rowNumber: Number,
        sourceId: String,
        reason: String
      }
    ],
    reconciliationSummary: { type: Schema.Types.Mixed, default: {} },
    executedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, versionKey: false }
);
export const MigrationBatch = mongoose.model('MigrationBatch', migrationBatchSchema);

