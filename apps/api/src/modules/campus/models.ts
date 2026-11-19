import mongoose, { Schema } from 'mongoose';

// Library (FM-12)
const libraryItemSchema = new Schema(
  {
    isbn: { type: String, required: true, trim: true },
    barcode: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    publisher: { type: String, default: '' },
    category: { type: String, default: 'Engineering' },
    totalCopies: { type: Number, default: 1, min: 1 },
    availableCopies: { type: Number, default: 1, min: 0 },
    resourceType: { type: String, enum: ['Physical', 'Digital'], default: 'Physical' },
    digitalUrl: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);
export const LibraryItem = mongoose.model('LibraryItem', libraryItemSchema);

const circulationRecordSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'LibraryItem', required: true },
    itemTitle: { type: String, required: true },
    borrowerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    borrowerName: { type: String, required: true },
    issuedAt: { type: Date, default: () => new Date() },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    fineInr: { type: Number, default: 0 },
    status: { type: String, enum: ['issued', 'returned', 'reserved'], default: 'issued' }
  },
  { timestamps: true, versionKey: false }
);
export const CirculationRecord = mongoose.model('CirculationRecord', circulationRecordSchema);

// Hostel & Mess (FM-13)
const hostelSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    genderPolicy: { type: String, enum: ['Boys', 'Girls', 'CoEd'], required: true },
    wardenUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    wardenName: { type: String, default: '' },
    totalRooms: { type: Number, default: 50 },
    totalBeds: { type: Number, default: 100 },
    messMenuSummary: { type: String, default: '' },
    monthlyFeeInr: { type: Number, default: 6500 }
  },
  { timestamps: true, versionKey: false }
);
export const Hostel = mongoose.model('Hostel', hostelSchema);

const bedAllocationSchema = new Schema(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    hostelName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    bedNumber: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    status: { type: String, enum: ['requested', 'allocated', 'vacated', 'rejected'], default: 'requested' },
    allocatedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    vacatedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
export const BedAllocation = mongoose.model('BedAllocation', bedAllocationSchema);

// Documents & Verifiable Certificates (FM-15)
const documentRecordSchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true },
    category: { type: String, enum: ['Academic', 'Identity', 'HR', 'Finance', 'Other'], required: true },
    title: { type: String, required: true },
    version: { type: Number, default: 1 },
    objectKey: { type: String, required: true },
    sha256: { type: String, required: true },
    mimeType: { type: String, required: true },
    malwareScanStatus: { type: String, default: 'clean_heuristic' },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true, versionKey: false }
);
export const DocumentRecord = mongoose.model('DocumentRecord', documentRecordSchema);

const certificateRecordSchema = new Schema(
  {
    serialNo: { type: String, required: true, unique: true, uppercase: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    certificateType: { type: String, required: true },
    purpose: { type: String, default: '' },
    status: {
      type: String,
      enum: ['requested', 'verified', 'signed_issued', 'rejected', 'revoked'],
      default: 'requested'
    },
    qrVerificationToken: { type: String, required: true, unique: true },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    signedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    signedByName: { type: String, default: '' },
    issuedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
export const CertificateRecord = mongoose.model('CertificateRecord', certificateRecordSchema);

// Confidential Grievance & Helpdesk (FM-19)
const grievanceTicketSchema = new Schema(
  {
    ticketNo: { type: String, required: true, unique: true, uppercase: true },
    submittedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    confidential: { type: Boolean, default: false },
    assignedPool: { type: String, default: 'ADMIN_HELPDESK' }, // CONFIDENTIAL_COMMITTEE for sensitive grievances
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    slaDueAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['open', 'in_review', 'escalated', 'resolved', 'closed'],
      default: 'open'
    },
    resolutionNotes: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);
grievanceTicketSchema.index({ submittedByUserId: 1, createdAt: -1 });
grievanceTicketSchema.index({ confidential: 1, assignedToUserId: 1 });
export const GrievanceTicket = mongoose.model('GrievanceTicket', grievanceTicketSchema);

// Placement & Alumni (FM-16, FM-17)
const placementDriveSchema = new Schema(
  {
    driveCode: { type: String, required: true, unique: true, uppercase: true },
    companyName: { type: String, required: true },
    roleTitle: { type: String, required: true },
    packageLpa: { type: Number, required: true },
    minCgpa: { type: Number, default: 6.5 },
    maxBacklogs: { type: Number, default: 0 },
    driveDate: { type: String, required: true },
    applicants: [
      {
        _id: false,
        studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
        studentName: String,
        rollNumber: String,
        status: { type: String, enum: ['applied', 'shortlisted', 'offered', 'rejected'], default: 'applied' }
      }
    ],
    status: { type: String, enum: ['open', 'closed', 'completed'], default: 'open' }
  },
  { timestamps: true, versionKey: false }
);
export const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);

const alumniProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    fullName: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    departmentCode: { type: String, required: true },
    currentOrganization: { type: String, default: '' },
    roleTitle: { type: String, default: '' },
    openToMentorship: { type: Boolean, default: true },
    directoryVisible: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);
export const AlumniProfile = mongoose.model('AlumniProfile', alumniProfileSchema);

// Inventory & Procurement (FM-18)
const inventoryAssetSchema = new Schema(
  {
    assetTag: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    departmentCode: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 0 },
    unitCostInr: { type: Number, default: 0 },
    vendorName: { type: String, default: '' },
    status: { type: String, enum: ['in_stock', 'allocated', 'maintenance', 'retired'], default: 'in_stock' }
  },
  { timestamps: true, versionKey: false }
);
export const InventoryAsset = mongoose.model('InventoryAsset', inventoryAssetSchema);

const procurementRequestSchema = new Schema(
  {
    requestNo: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    estimatedCostInr: { type: Number, required: true, min: 1 },
    departmentCode: { type: String, required: true },
    requestedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    budgetApprovedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    finalApprovedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['requested', 'budget_approved', 'approved', 'received', 'rejected'],
      default: 'requested'
    }
  },
  { timestamps: true, versionKey: false }
);
export const ProcurementRequest = mongoose.model('ProcurementRequest', procurementRequestSchema);

// Events, Research, Sports, Safety & Visitor Register (FM-20, 22, 23, 24)
const campusEventSchema = new Schema(
  {
    eventCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, enum: ['Academic', 'Cultural', 'Sports', 'Club', 'Workshop'], default: 'Academic' },
    eventDate: { type: String, required: true },
    venue: { type: String, required: true },
    budgetInr: { type: Number, default: 0 },
    status: { type: String, enum: ['proposed', 'approved', 'completed'], default: 'proposed' },
    registeredUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true, versionKey: false }
);
export const CampusEvent = mongoose.model('CampusEvent', campusEventSchema);

const researchProjectSchema = new Schema(
  {
    projectCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    principalInvestigator: { type: String, required: true },
    fundingAgency: { type: String, default: 'Institutional Seed Grant' },
    grantAmountInr: { type: Number, default: 0 },
    ethicsApproved: { type: Boolean, default: false },
    publicationsCount: { type: Number, default: 0 },
    patentsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['proposal', 'active', 'completed'], default: 'proposal' }
  },
  { timestamps: true, versionKey: false }
);
export const ResearchProject = mongoose.model('ResearchProject', researchProjectSchema);

const visitorLogSchema = new Schema(
  {
    visitorName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    purpose: { type: String, required: true },
    hostName: { type: String, required: true },
    entryAt: { type: Date, default: () => new Date() },
    exitAt: { type: Date, default: null },
    recordedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Automatic retention cleanup per PRD 13.24
    retainUntil: { type: Date, default: () => new Date(Date.now() + 90 * 86_400_000) }
  },
  { timestamps: true, versionKey: false }
);
visitorLogSchema.index({ retainUntil: 1 }, { expireAfterSeconds: 0 });
export const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);

const safetyIncidentSchema = new Schema(
  {
    incidentNo: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    location: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['reported', 'investigating', 'resolved'], default: 'reported' },
    reportedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, versionKey: false }
);
export const SafetyIncident = mongoose.model('SafetyIncident', safetyIncidentSchema);

