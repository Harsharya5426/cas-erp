import mongoose, { Schema } from 'mongoose';

const attendanceEventSchema = new Schema(
  {
    personType: { type: String, enum: ['student', 'employee'], required: true },
    personId: { type: Schema.Types.ObjectId, required: true },
    personCode: { type: String, required: true },
    personName: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    subjectCode: { type: String, uppercase: true, default: '' },
    sessionDate: { type: String, required: true }, // YYYY-MM-DD in Asia/Kolkata
    lectureSlot: { type: String, default: 'SLOT-1' },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], required: true },
    captureMethod: {
      type: String,
      enum: ['manual', 'qr', 'rfid', 'device', 'face_advisory'],
      default: 'manual'
    },
    idempotencyKey: { type: String, required: true, unique: true },
    markedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    workingHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    correctionRequest: {
      requestedStatus: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'] },
      reason: String,
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      requestedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      remarks: String
    }
  },
  { timestamps: true, versionKey: false }
);

attendanceEventSchema.index({ personType: 1, personId: 1, sessionDate: -1 });
attendanceEventSchema.index({ subjectCode: 1, sessionDate: -1 });
export const AttendanceEvent = mongoose.model('AttendanceEvent', attendanceEventSchema);

const qrAttendanceSessionSchema = new Schema(
  {
    subjectCode: { type: String, required: true, uppercase: true },
    sessionDate: { type: String, required: true },
    lectureSlot: { type: String, required: true },
    codeToken: { type: String, required: true, unique: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);
qrAttendanceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const QrAttendanceSession = mongoose.model('QrAttendanceSession', qrAttendanceSessionSchema);

const biometricConsentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    consentGiven: { type: Boolean, required: true },
    alternativeMethodSelected: { type: String, enum: ['manual', 'qr', 'rfid'], default: 'qr' },
    consentNoticeVersion: { type: String, required: true },
    templateHashOnly: { type: String, default: '' }, // never raw face photo
    revokedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
export const BiometricConsent = mongoose.model('BiometricConsent', biometricConsentSchema);

const faceProfileSchema = new Schema(
  {
    personType: { type: String, enum: ['student', 'employee'], required: true, default: 'student' },
    personId: { type: Schema.Types.ObjectId, required: true, unique: true },
    personCode: { type: String, required: true },
    personName: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    descriptor: { type: [Number], required: true }, // 128-D L2-normalized numerical feature vector (no raw image)
    descriptorHash: { type: String, required: true },
    sampleCount: { type: Number, default: 1 },
    consentRecorded: { type: Boolean, default: true },
    enrolledByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);
faceProfileSchema.index({ personType: 1, active: 1 });
export const FaceProfile = mongoose.model('FaceProfile', faceProfileSchema);

