export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly IDEMPOTENCY_CONFLICT: "IDEMPOTENCY_CONFLICT";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly MFA_REQUIRED: "MFA_REQUIRED";
    readonly POLICY_GATE_BLOCKED: "POLICY_GATE_BLOCKED";
    readonly INTEGRATION_NOT_CONFIGURED: "INTEGRATION_NOT_CONFIGURED";
    readonly EXTERNAL_GATEWAY_ERROR: "EXTERNAL_GATEWAY_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export declare const PROGRAM_TYPES: readonly ["UG", "PG", "PhD", "Diploma", "Certificate"];
export declare const ATTENDANCE_CAPTURE_METHODS: readonly ["manual", "qr", "rfid", "device", "face_advisory"];
export type AttendanceCaptureMethod = (typeof ATTENDANCE_CAPTURE_METHODS)[number];
export declare const ATTENDANCE_STATUSES: readonly ["Present", "Absent", "Late", "Excused"];
export declare const LEAVE_CATEGORIES: {
    readonly EMPLOYEE: readonly [{
        readonly id: "CL";
        readonly labelEn: "Casual Leave (CL)";
        readonly labelHi: "आकस्मिक अवकाश (CL)";
        readonly defaultBalance: 12;
    }, {
        readonly id: "SL";
        readonly labelEn: "Sick Leave (SL)";
        readonly labelHi: "चिकित्सा अवकाश (SL)";
        readonly defaultBalance: 10;
    }, {
        readonly id: "EL";
        readonly labelEn: "Earned Leave (EL)";
        readonly labelHi: "अर्जित अवकाश (EL)";
        readonly defaultBalance: 15;
    }, {
        readonly id: "MEDICAL";
        readonly labelEn: "Medical Leave";
        readonly labelHi: "चिकित्सीय अवकाश";
        readonly defaultBalance: 15;
    }, {
        readonly id: "MATERNITY";
        readonly labelEn: "Maternity Leave";
        readonly labelHi: "मातृत्व अवकाश";
        readonly defaultBalance: 180;
    }, {
        readonly id: "PATERNITY";
        readonly labelEn: "Paternity Leave";
        readonly labelHi: "पितृत्व अवकाश";
        readonly defaultBalance: 15;
    }, {
        readonly id: "UNPAID";
        readonly labelEn: "Leave Without Pay (LWP)";
        readonly labelHi: "अवैतनिक अवकाश";
        readonly defaultBalance: 30;
    }, {
        readonly id: "SPECIAL";
        readonly labelEn: "Special Academic / Duty Leave";
        readonly labelHi: "विशेष शैक्षणिक अवकाश";
        readonly defaultBalance: 10;
    }];
    readonly STUDENT: readonly [{
        readonly id: "MEDICAL";
        readonly labelEn: "Medical / Health Leave";
        readonly labelHi: "स्वास्थ्य अवकाश";
        readonly maxDays: 15;
    }, {
        readonly id: "FAMILY";
        readonly labelEn: "Family Emergency";
        readonly labelHi: "पारिवारिक आपातकाल";
        readonly maxDays: 7;
    }, {
        readonly id: "ACADEMIC";
        readonly labelEn: "Academic Event / Conference";
        readonly labelHi: "शैक्षणिक सम्मेलन";
        readonly maxDays: 5;
    }, {
        readonly id: "INTERNSHIP";
        readonly labelEn: "Internship / Placement Drive";
        readonly labelHi: "इंटर्नशिप / प्लेसमेंट";
        readonly maxDays: 10;
    }, {
        readonly id: "OUTPASS";
        readonly labelEn: "Hostel Outpass / Early Exit";
        readonly labelHi: "हॉस्टल आउटपास";
        readonly maxDays: 3;
    }, {
        readonly id: "OTHER";
        readonly labelEn: "Other Permission";
        readonly labelHi: "अन्य अनुमति";
        readonly maxDays: 5;
    }];
};
export declare const CERTIFICATE_TYPES: readonly ["Bonafide", "Character", "Transfer", "Migration", "FeeStructure", "ProvisionalTranscript"];
export declare const WORKFLOW_STATES: readonly ["draft", "submitted", "under_review", "verified", "approved", "rejected", "cancelled", "published"];
export declare const GRIEVANCE_CATEGORIES: readonly ["Academic", "Examination", "Finance", "Hostel", "IT & Infrastructure", "Harassment / Confidential", "Administrative", "Other"];
export declare const AKTU_GRADE_POINTS: Record<string, number>;
