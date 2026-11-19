export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    MFA_REQUIRED: 'MFA_REQUIRED',
    POLICY_GATE_BLOCKED: 'POLICY_GATE_BLOCKED',
    INTEGRATION_NOT_CONFIGURED: 'INTEGRATION_NOT_CONFIGURED',
    EXTERNAL_GATEWAY_ERROR: 'EXTERNAL_GATEWAY_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};
export const PROGRAM_TYPES = ['UG', 'PG', 'PhD', 'Diploma', 'Certificate'];
export const ATTENDANCE_CAPTURE_METHODS = [
    'manual',
    'qr',
    'rfid',
    'device',
    'face_advisory'
];
export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Excused'];
export const LEAVE_CATEGORIES = {
    EMPLOYEE: [
        { id: 'CL', labelEn: 'Casual Leave (CL)', labelHi: 'आकस्मिक अवकाश (CL)', defaultBalance: 12 },
        { id: 'SL', labelEn: 'Sick Leave (SL)', labelHi: 'चिकित्सा अवकाश (SL)', defaultBalance: 10 },
        { id: 'EL', labelEn: 'Earned Leave (EL)', labelHi: 'अर्जित अवकाश (EL)', defaultBalance: 15 },
        { id: 'MEDICAL', labelEn: 'Medical Leave', labelHi: 'चिकित्सीय अवकाश', defaultBalance: 15 },
        { id: 'MATERNITY', labelEn: 'Maternity Leave', labelHi: 'मातृत्व अवकाश', defaultBalance: 180 },
        { id: 'PATERNITY', labelEn: 'Paternity Leave', labelHi: 'पितृत्व अवकाश', defaultBalance: 15 },
        { id: 'UNPAID', labelEn: 'Leave Without Pay (LWP)', labelHi: 'अवैतनिक अवकाश', defaultBalance: 30 },
        { id: 'SPECIAL', labelEn: 'Special Academic / Duty Leave', labelHi: 'विशेष शैक्षणिक अवकाश', defaultBalance: 10 }
    ],
    STUDENT: [
        { id: 'MEDICAL', labelEn: 'Medical / Health Leave', labelHi: 'स्वास्थ्य अवकाश', maxDays: 15 },
        { id: 'FAMILY', labelEn: 'Family Emergency', labelHi: 'पारिवारिक आपातकाल', maxDays: 7 },
        { id: 'ACADEMIC', labelEn: 'Academic Event / Conference', labelHi: 'शैक्षणिक सम्मेलन', maxDays: 5 },
        { id: 'INTERNSHIP', labelEn: 'Internship / Placement Drive', labelHi: 'इंटर्नशिप / प्लेसमेंट', maxDays: 10 },
        { id: 'OUTPASS', labelEn: 'Hostel Outpass / Early Exit', labelHi: 'हॉस्टल आउटपास', maxDays: 3 },
        { id: 'OTHER', labelEn: 'Other Permission', labelHi: 'अन्य अनुमति', maxDays: 5 }
    ]
};
export const CERTIFICATE_TYPES = [
    'Bonafide',
    'Character',
    'Transfer',
    'Migration',
    'FeeStructure',
    'ProvisionalTranscript'
];
export const WORKFLOW_STATES = [
    'draft',
    'submitted',
    'under_review',
    'verified',
    'approved',
    'rejected',
    'cancelled',
    'published'
];
export const GRIEVANCE_CATEGORIES = [
    'Academic',
    'Examination',
    'Finance',
    'Hostel',
    'IT & Infrastructure',
    'Harassment / Confidential',
    'Administrative',
    'Other'
];
export const AKTU_GRADE_POINTS = {
    O: 10,
    'A+': 9,
    A: 8,
    'B+': 7,
    B: 6,
    C: 5,
    P: 4,
    F: 0,
    AB: 0
};
//# sourceMappingURL=constants.js.map