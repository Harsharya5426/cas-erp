export const ROLE_KEYS = [
  'SUPER_ADMIN',
  'PRINCIPAL',
  'COLLEGE_ADMIN',
  'HOD',
  'FACULTY',
  'STUDENT',
  'PARENT',
  'ACCOUNTANT',
  'ADMISSION_OFFICER',
  'EXAM_CONTROLLER',
  'LIBRARIAN',
  'HOSTEL_WARDEN'
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export const PERMISSION_VERBS = [
  'view',
  'create',
  'edit',
  'delete',
  'submit',
  'approve',
  'reject',
  'publish',
  'export',
  'configure',
  'manage-users'
] as const;

export type PermissionVerb = (typeof PERMISSION_VERBS)[number];

export const ERP_MODULES = [
  'identity',
  'rbac',
  'settings',
  'audit',
  'academics',
  'admissions',
  'cms',
  'students',
  'faculty',
  'timetable',
  'attendance',
  'hr',
  'payroll',
  'leave',
  'finance',
  'accounting',
  'exams',
  'lms',
  'library',
  'hostel',
  'documents',
  'certificates',
  'placement',
  'alumni',
  'inventory',
  'grievances',
  'events',
  'research',
  'sports',
  'safety',
  'reports',
  'ai',
  'migration',
  'notifications',
  'backup'
] as const;

export type ErpModule = (typeof ERP_MODULES)[number];

export type AccessScope =
  | 'all'
  | 'department'
  | 'assigned'
  | 'own'
  | 'linked-student'
  | 'hostel'
  | 'pool-assigned';

export interface ModulePermissionRule {
  module: ErpModule;
  actions: PermissionVerb[];
  scope: AccessScope;
}

export interface RoleTemplateSeed {
  key: RoleKey;
  name: string;
  nameHi: string;
  description: string;
  isSystemRole: boolean;
  requiresMfaRecommended: boolean;
  permissions: ModulePermissionRule[];
}

export const DEFAULT_ROLE_TEMPLATES: RoleTemplateSeed[] = [
  {
    key: 'SUPER_ADMIN',
    name: 'Super Admin',
    nameHi: 'सुपर एडमिन',
    description: 'Platform infrastructure, RBAC, configuration, migration, and backup administration (restricted from confidential grievances & unilateral grade/finance approval).',
    isSystemRole: true,
    requiresMfaRecommended: true,
    permissions: [
      { module: 'identity', actions: ['view', 'create', 'edit', 'configure', 'manage-users'], scope: 'all' },
      { module: 'rbac', actions: ['view', 'create', 'edit', 'configure', 'manage-users'], scope: 'all' },
      { module: 'settings', actions: ['view', 'edit', 'configure'], scope: 'all' },
      { module: 'audit', actions: ['view', 'export'], scope: 'all' },
      { module: 'academics', actions: ['view', 'create', 'edit', 'configure'], scope: 'all' },
      { module: 'cms', actions: ['view', 'create', 'edit', 'publish', 'configure'], scope: 'all' },
      { module: 'migration', actions: ['view', 'create', 'edit', 'configure'], scope: 'all' },
      { module: 'backup', actions: ['view', 'create', 'configure'], scope: 'all' },
      { module: 'notifications', actions: ['view', 'create', 'configure'], scope: 'all' },
      { module: 'reports', actions: ['view'], scope: 'all' },
      { module: 'ai', actions: ['view', 'configure'], scope: 'all' }
    ]
  },
  {
    key: 'PRINCIPAL',
    name: 'Principal / Director',
    nameHi: 'प्राचार्य / निदेशक',
    description: 'Institution-wide executive oversight and designated final approvals.',
    isSystemRole: true,
    requiresMfaRecommended: true,
    permissions: [
      { module: 'settings', actions: ['view', 'edit', 'configure'], scope: 'all' },
      { module: 'audit', actions: ['view', 'export'], scope: 'all' },
      { module: 'academics', actions: ['view', 'approve', 'publish', 'configure'], scope: 'all' },
      { module: 'admissions', actions: ['view', 'approve', 'reject', 'export'], scope: 'all' },
      { module: 'students', actions: ['view', 'export'], scope: 'all' },
      { module: 'faculty', actions: ['view', 'export'], scope: 'all' },
      { module: 'timetable', actions: ['view'], scope: 'all' },
      { module: 'attendance', actions: ['view', 'export'], scope: 'all' },
      { module: 'hr', actions: ['view', 'approve', 'reject'], scope: 'all' },
      { module: 'payroll', actions: ['view', 'approve', 'reject'], scope: 'all' },
      { module: 'leave', actions: ['view', 'approve', 'reject'], scope: 'all' },
      { module: 'finance', actions: ['view', 'approve', 'reject', 'export'], scope: 'all' },
      { module: 'accounting', actions: ['view', 'approve', 'export'], scope: 'all' },
      { module: 'exams', actions: ['view', 'approve', 'publish'], scope: 'all' },
      { module: 'certificates', actions: ['view', 'approve', 'publish'], scope: 'all' },
      { module: 'grievances', actions: ['view', 'approve', 'edit'], scope: 'pool-assigned' },
      { module: 'inventory', actions: ['view', 'approve', 'reject'], scope: 'all' },
      { module: 'research', actions: ['view', 'approve', 'reject'], scope: 'all' },
      { module: 'events', actions: ['view', 'approve', 'publish'], scope: 'all' },
      { module: 'reports', actions: ['view', 'export'], scope: 'all' },
      { module: 'notifications', actions: ['view', 'create', 'publish'], scope: 'all' },
      { module: 'ai', actions: ['view', 'submit'], scope: 'all' }
    ]
  },
  {
    key: 'COLLEGE_ADMIN',
    name: 'College Administrator',
    nameHi: 'महाविद्यालय प्रशासक',
    description: 'Delegated campus and operational administration.',
    isSystemRole: true,
    requiresMfaRecommended: true,
    permissions: [
      { module: 'identity', actions: ['view', 'create', 'edit', 'manage-users'], scope: 'all' },
      { module: 'settings', actions: ['view', 'edit'], scope: 'all' },
      { module: 'academics', actions: ['view', 'create', 'edit', 'configure'], scope: 'all' },
      { module: 'cms', actions: ['view', 'create', 'edit', 'publish'], scope: 'all' },
      { module: 'admissions', actions: ['view', 'create', 'edit', 'approve', 'reject'], scope: 'all' },
      { module: 'students', actions: ['view', 'create', 'edit', 'export'], scope: 'all' },
      { module: 'faculty', actions: ['view', 'create', 'edit', 'export'], scope: 'all' },
      { module: 'timetable', actions: ['view', 'create', 'edit', 'delete'], scope: 'all' },
      { module: 'attendance', actions: ['view', 'edit', 'approve'], scope: 'all' },
      { module: 'hr', actions: ['view', 'create', 'edit'], scope: 'all' },
      { module: 'leave', actions: ['view', 'approve', 'reject'], scope: 'all' },
      { module: 'documents', actions: ['view', 'create', 'edit', 'approve'], scope: 'all' },
      { module: 'certificates', actions: ['view', 'create', 'edit', 'approve'], scope: 'all' },
      { module: 'inventory', actions: ['view', 'create', 'edit', 'approve'], scope: 'all' },
      { module: 'events', actions: ['view', 'create', 'edit', 'approve', 'publish'], scope: 'all' },
      { module: 'placement', actions: ['view', 'create', 'edit'], scope: 'all' },
      { module: 'alumni', actions: ['view', 'create', 'edit'], scope: 'all' },
      { module: 'sports', actions: ['view', 'create', 'edit'], scope: 'all' },
      { module: 'safety', actions: ['view', 'create', 'edit'], scope: 'all' },
      { module: 'grievances', actions: ['view', 'edit'], scope: 'pool-assigned' },
      { module: 'notifications', actions: ['view', 'create', 'publish'], scope: 'all' },
      { module: 'reports', actions: ['view', 'export'], scope: 'all' },
      { module: 'ai', actions: ['view', 'submit'], scope: 'all' }
    ]
  },
  {
    key: 'HOD',
    name: 'Head of Department (HOD)',
    nameHi: 'विभागाध्यक्ष',
    description: 'Department-scoped academic, timetable, attendance, leave, and marks verification authority.',
    isSystemRole: true,
    requiresMfaRecommended: false,
    permissions: [
      { module: 'academics', actions: ['view', 'create', 'edit'], scope: 'department' },
      { module: 'students', actions: ['view', 'edit', 'export'], scope: 'department' },
      { module: 'faculty', actions: ['view', 'edit'], scope: 'department' },
      { module: 'timetable', actions: ['view', 'create', 'edit'], scope: 'department' },
      { module: 'attendance', actions: ['view', 'create', 'edit', 'approve', 'reject', 'export'], scope: 'department' },
      { module: 'leave', actions: ['view', 'create', 'submit', 'approve', 'reject'], scope: 'department' },
      { module: 'exams', actions: ['view', 'approve', 'reject'], scope: 'department' },
      { module: 'lms', actions: ['view', 'create', 'edit'], scope: 'department' },
      { module: 'research', actions: ['view', 'create', 'edit', 'approve'], scope: 'department' },
      { module: 'events', actions: ['view', 'create', 'approve'], scope: 'department' },
      { module: 'grievances', actions: ['view', 'edit'], scope: 'pool-assigned' },
      { module: 'notifications', actions: ['view', 'create'], scope: 'department' },
      { module: 'reports', actions: ['view', 'export'], scope: 'department' },
      { module: 'ai', actions: ['view', 'submit'], scope: 'department' }
    ]
  },
  {
    key: 'FACULTY',
    name: 'Faculty / Teacher',
    nameHi: 'शिक्षक / संकाय',
    description: 'Assigned classes, lecture attendance, LMS content, internal marks entry, and own leave.',
    isSystemRole: true,
    requiresMfaRecommended: false,
    permissions: [
      { module: 'academics', actions: ['view'], scope: 'assigned' },
      { module: 'students', actions: ['view'], scope: 'assigned' },
      { module: 'timetable', actions: ['view'], scope: 'assigned' },
      { module: 'attendance', actions: ['view', 'create', 'submit'], scope: 'assigned' },
      { module: 'exams', actions: ['view', 'create', 'edit', 'submit'], scope: 'assigned' },
      { module: 'lms', actions: ['view', 'create', 'edit', 'delete'], scope: 'assigned' },
      { module: 'leave', actions: ['view', 'create', 'submit'], scope: 'own' },
      { module: 'hr', actions: ['view'], scope: 'own' },
      { module: 'payroll', actions: ['view'], scope: 'own' },
      { module: 'library', actions: ['view', 'submit'], scope: 'own' },
      { module: 'research', actions: ['view', 'create', 'edit', 'submit'], scope: 'own' },
      { module: 'events', actions: ['view', 'create'], scope: 'own' },
      { module: 'grievances', actions: ['view', 'create', 'submit'], scope: 'own' },
      { module: 'notifications', actions: ['view'], scope: 'own' },
      { module: 'ai', actions: ['view', 'submit'], scope: 'assigned' }
    ]
  },
  {
    key: 'STUDENT',
    name: 'Student',
    nameHi: 'छात्र / छात्रा',
    description: 'Self-service access to own academic, attendance, timetable, fee, LMS, certificate, and campus requests.',
    isSystemRole: true,
    requiresMfaRecommended: false,
    permissions: [
      { module: 'academics', actions: ['view'], scope: 'own' },
      { module: 'timetable', actions: ['view'], scope: 'own' },
      { module: 'attendance', actions: ['view', 'submit'], scope: 'own' },
      { module: 'finance', actions: ['view', 'submit'], scope: 'own' },
      { module: 'exams', actions: ['view', 'submit'], scope: 'own' },
      { module: 'lms', actions: ['view', 'submit'], scope: 'own' },
      { module: 'leave', actions: ['view', 'create', 'submit'], scope: 'own' },
      { module: 'library', actions: ['view', 'submit'], scope: 'own' },
      { module: 'hostel', actions: ['view', 'create', 'submit'], scope: 'own' },
      { module: 'documents', actions: ['view', 'create'], scope: 'own' },
      { module: 'certificates', actions: ['view', 'create', 'submit'], scope: 'own' },
      { module: 'placement', actions: ['view', 'create', 'submit'], scope: 'own' },
      { module: 'grievances', actions: ['view', 'create', 'submit'], scope: 'own' },
      { module: 'events', actions: ['view', 'submit'], scope: 'own' },
      { module: 'sports', actions: ['view', 'submit'], scope: 'own' },
      { module: 'notifications', actions: ['view'], scope: 'own' },
      { module: 'ai', actions: ['view', 'submit'], scope: 'own' }
    ]
  },
  {
    key: 'PARENT',
    name: 'Parent / Guardian',
    nameHi: 'अभिभावक',
    description: 'Verified linked-student read/payment/consent access governed by guardian link verification.',
    isSystemRole: true,
    requiresMfaRecommended: false,
    permissions: [
      { module: 'academics', actions: ['view'], scope: 'linked-student' },
      { module: 'timetable', actions: ['view'], scope: 'linked-student' },
      { module: 'attendance', actions: ['view'], scope: 'linked-student' },
      { module: 'finance', actions: ['view', 'submit'], scope: 'linked-student' },
      { module: 'exams', actions: ['view'], scope: 'linked-student' },
      { module: 'leave', actions: ['view', 'approve', 'reject'], scope: 'linked-student' },
      { module: 'hostel', actions: ['view'], scope: 'linked-student' },
      { module: 'notifications', actions: ['view'], scope: 'own' }
    ]
  },
  {
    key: 'ACCOUNTANT',
    name: 'Accountant',
    nameHi: 'लेखाकार',
    description: 'Fee plans, invoices, offline receipts, Cashfree reconciliation, double-entry ledger, and refund preparation.',
    isSystemRole: true,
    requiresMfaRecommended: true,
    permissions: [
      { module: 'students', actions: ['view'], scope: 'all' },
      { module: 'finance', actions: ['view', 'create', 'edit', 'submit', 'export', 'configure'], scope: 'all' },
      { module: 'accounting', actions: ['view', 'create', 'edit', 'submit', 'export'], scope: 'all' },
      { module: 'payroll', actions: ['view', 'create', 'edit', 'submit'], scope: 'all' },
      { module: 'inventory', actions: ['view', 'approve'], scope: 'all' },
      { module: 'reports', actions: ['view', 'export'], scope: 'all' },
      { module: 'notifications', actions: ['view'], scope: 'own' }
    ]
  },
  {
    key: 'ADMISSION_OFFICER',
    name: 'Admission Officer',
    nameHi: 'प्रवेश अधिकारी',
    description: 'Applicant review, document verification, merit preparation, and enrollment onboarding.',
    isSystemRole: true,
    requiresMfaRecommended: false,
    permissions: [
      { module: 'cms', actions: ['view', 'create', 'edit'], scope: 'all' },
      { module: 'admissions', actions: ['view', 'create', 'edit', 'submit', 'export'], scope: 'all' },
      { module: 'students', actions: ['view', 'create'], scope: 'all' },
      { module: 'documents', actions: ['view', 'create', 'approve', 'reject'], scope: 'all' },
      { module: 'reports', actions: ['view', 'export'], scope: 'all' },
      { module: 'notifications', actions: ['view', 'create'], scope: 'all' }
    ]
  },
  {
    key: 'EXAM_CONTROLLER',
    name: 'Examination Controller',
    nameHi: 'परीक्षा नियंत्रक',
    description: 'Examination scheduling, admit cards, marks verification, revaluation, and result publication.',
    isSystemRole: true,
    requiresMfaRecommended: true,
    permissions: [
      { module: 'academics', actions: ['view'], scope: 'all' },
      { module: 'students', actions: ['view'], scope: 'all' },
      { module: 'exams', actions: ['view', 'create', 'edit', 'approve', 'reject', 'publish', 'export', 'configure'], scope: 'all' },
      { module: 'certificates', actions: ['view', 'create', 'approve', 'publish'], scope: 'all' },
      { module: 'reports', actions: ['view', 'export'], scope: 'all' },
      { module: 'notifications', actions: ['view', 'create'], scope: 'all' }
    ]
  },
  {
    key: 'LIBRARIAN',
    name: 'Librarian',
    nameHi: 'पुस्तकालयाध्यक्ष',
    description: 'Library catalogue, ISBN/QR records, issue/return/renewal, reservations, and overdue fine tracking.',
    isSystemRole: true,
    requiresMfaRecommended: false,
    permissions: [
      { module: 'library', actions: ['view', 'create', 'edit', 'delete', 'submit', 'export'], scope: 'all' },
      { module: 'students', actions: ['view'], scope: 'all' },
      { module: 'faculty', actions: ['view'], scope: 'all' },
      { module: 'reports', actions: ['view', 'export'], scope: 'all' },
      { module: 'notifications', actions: ['view'], scope: 'own' }
    ]
  },
  {
    key: 'HOSTEL_WARDEN',
    name: 'Hostel Warden',
    nameHi: 'छात्रावास वार्डन',
    description: 'Hostel buildings/rooms/beds allocation, hostel attendance, outpass, mess menu, and maintenance.',
    isSystemRole: true,
    requiresMfaRecommended: false,
    permissions: [
      { module: 'hostel', actions: ['view', 'create', 'edit', 'approve', 'reject', 'export'], scope: 'hostel' },
      { module: 'leave', actions: ['view', 'approve', 'reject'], scope: 'hostel' },
      { module: 'students', actions: ['view'], scope: 'hostel' },
      { module: 'safety', actions: ['view', 'create', 'edit'], scope: 'hostel' },
      { module: 'notifications', actions: ['view', 'create'], scope: 'hostel' },
      { module: 'reports', actions: ['view', 'export'], scope: 'hostel' }
    ]
  }
];

export function hasRolePermission(
  permissions: ModulePermissionRule[],
  moduleName: ErpModule,
  verb: PermissionVerb
): ModulePermissionRule | undefined {
  return permissions.find(
    (rule) => rule.module === moduleName && rule.actions.includes(verb)
  );
}

