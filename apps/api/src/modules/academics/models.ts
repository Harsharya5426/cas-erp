import mongoose, { Schema } from 'mongoose';

const studentSchema = new Schema(
  {
    studentCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    rollNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    deptCode: { type: String, required: true, uppercase: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', default: null },
    programCode: { type: String, default: 'BTECH' },
    semesterNumber: { type: Number, default: 1, min: 1, max: 12 },
    batch: { type: String, default: '2026 - 2030' },
    section: { type: String, default: 'A' },
    cgpa: { type: Number, default: 0, min: 0, max: 10 },
    attendancePct: { type: Number, default: 100, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['Active', 'Graduating', 'Alumni', 'Suspended', 'Withdrawn'],
      default: 'Active'
    },
    enrolledSubjectCodes: { type: [String], default: [] },
    guardianSummary: {
      name: { type: String, default: '' },
      relation: { type: String, default: 'Parent' },
      phone: { type: String, default: '' }
    },
    totalFeeAssessedInr: { type: Number, default: 0 },
    paidFeeInr: { type: Number, default: 0 },
    dueFeeInr: { type: Number, default: 0 },
    feeStatus: { type: String, enum: ['Paid', 'Partial', 'Pending', 'Overdue'], default: 'Pending' },
    isSyntheticPlaceholder: { type: Boolean, default: false },
    sourceSystemRef: {
      sourceSystem: String,
      sourceId: String,
      migrationBatchId: String
    }
  },
  { timestamps: true, versionKey: false }
);

studentSchema.index({ departmentId: 1, semesterNumber: 1 });
studentSchema.index({ userId: 1 });
export const Student = mongoose.model('Student', studentSchema);

const guardianLinkSchema = new Schema(
  {
    guardianUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    relationship: { type: String, enum: ['Father', 'Mother', 'LegalGuardian'], required: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'revoked'],
      default: 'pending'
    },
    allowAttendanceView: { type: Boolean, default: true },
    allowFeeViewAndPay: { type: Boolean, default: true },
    allowLeaveConsent: { type: Boolean, default: true },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
guardianLinkSchema.index({ guardianUserId: 1, studentId: 1 }, { unique: true });
export const GuardianLink = mongoose.model('GuardianLink', guardianLinkSchema);

const employeeSchema = new Schema(
  {
    employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    employeeType: { type: String, enum: ['Faculty', 'Administrative', 'Technical', 'Support'], default: 'Faculty' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    deptCode: { type: String, required: true, uppercase: true },
    designation: { type: String, required: true },
    administrativeRoles: { type: [String], default: [] },
    qualification: { type: String, default: '' },
    specialization: { type: String, default: '' },
    areasOfInterest: { type: [String], default: [] },
    bio: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    googleScholarUrl: { type: String, default: '' },
    scopusUrl: { type: String, default: '' },
    orcidUrl: { type: String, default: '' },
    researchGateUrl: { type: String, default: '' },
    publicationsPdfUrl: { type: String, default: '' },
    profilePageUrl: { type: String, default: '' },
    publicationsCount: { type: Number, default: 0 },
    joinDate: { type: Date, default: () => new Date() },
    shiftCode: { type: String, default: 'GENERAL' },
    baseSalaryInr: { type: Number, default: 75000 },
    hraInr: { type: Number, default: 15000 },
    daInr: { type: Number, default: 10000 },
    deductionsInr: { type: Number, default: 8000 },
    leaveBalances: {
      CL: { type: Number, default: 12 },
      SL: { type: Number, default: 10 },
      EL: { type: Number, default: 15 },
      MEDICAL: { type: Number, default: 15 },
      SPECIAL: { type: Number, default: 10 }
    },
    status: { type: String, enum: ['Active', 'OnLeave', 'Exited'], default: 'Active' },
    exitClearanceCompleted: { type: Boolean, default: false },
    isSyntheticPlaceholder: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);
employeeSchema.index({ departmentId: 1, employeeType: 1 });
export const Employee = mongoose.model('Employee', employeeSchema);

const timetableSlotSchema = new Schema(
  {
    semesterNumber: { type: Number, required: true, min: 1, max: 12 },
    batch: { type: String, required: true, trim: true },
    section: { type: String, default: 'A', trim: true },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    slotTime: { type: String, required: true, trim: true },
    subjectCode: { type: String, required: true, uppercase: true, trim: true },
    subjectName: { type: String, required: true },
    room: { type: String, required: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    facultyEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    facultyName: { type: String, required: true, trim: true },
    substitutionNote: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);
timetableSlotSchema.index({ dayOfWeek: 1, slotTime: 1, room: 1 });
timetableSlotSchema.index({ dayOfWeek: 1, slotTime: 1, facultyName: 1 });
export const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);

