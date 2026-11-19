import mongoose, { Schema } from 'mongoose';

const holidayCalendarSchema = new Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    name: { type: String, required: true },
    nameHi: { type: String, default: '' },
    type: { type: String, enum: ['Gazetted', 'Restricted', 'AcademicBreak'], default: 'Gazetted' }
  },
  { timestamps: true, versionKey: false }
);
export const HolidayCalendar = mongoose.model('HolidayCalendar', holidayCalendarSchema);

const leaveRequestSchema = new Schema(
  {
    requestNo: { type: String, required: true, unique: true },
    applicantType: { type: String, enum: ['student', 'employee'], required: true },
    applicantUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicantName: { type: String, required: true },
    applicantCode: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    deptCode: { type: String, default: '' },
    leaveType: { type: String, required: true, uppercase: true },
    fromDate: { type: String, required: true }, // YYYY-MM-DD
    toDate: { type: String, required: true },
    days: { type: Number, required: true, min: 0.5 },
    halfDay: { type: Boolean, default: false },
    reason: { type: String, required: true },
    urgency: { type: String, enum: ['normal', 'high', 'emergency'], default: 'normal' },
    contactDuringLeave: { type: String, default: '' },
    isHostelOutpass: { type: Boolean, default: false },
    parentApprovalRequired: { type: Boolean, default: false },
    parentApproved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    reviewedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedByName: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    remarks: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);
leaveRequestSchema.index({ applicantUserId: 1, createdAt: -1 });
leaveRequestSchema.index({ departmentId: 1, status: 1 });
export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

const payrollRunSchema = new Schema(
  {
    payrollNo: { type: String, required: true, unique: true },
    monthKey: { type: String, required: true }, // YYYY-MM
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    baseSalaryInr: { type: Number, required: true },
    hraInr: { type: Number, required: true },
    daInr: { type: Number, required: true },
    grossInr: { type: Number, required: true },
    deductionsInr: { type: Number, required: true },
    unpaidLeaveDeductionInr: { type: Number, default: 0 },
    netInr: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
    preparedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
payrollRunSchema.index({ monthKey: 1, employeeId: 1 }, { unique: true });
export const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);

