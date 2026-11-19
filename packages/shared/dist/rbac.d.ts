export declare const ROLE_KEYS: readonly ["SUPER_ADMIN", "PRINCIPAL", "COLLEGE_ADMIN", "HOD", "FACULTY", "STUDENT", "PARENT", "ACCOUNTANT", "ADMISSION_OFFICER", "EXAM_CONTROLLER", "LIBRARIAN", "HOSTEL_WARDEN"];
export type RoleKey = (typeof ROLE_KEYS)[number];
export declare const PERMISSION_VERBS: readonly ["view", "create", "edit", "delete", "submit", "approve", "reject", "publish", "export", "configure", "manage-users"];
export type PermissionVerb = (typeof PERMISSION_VERBS)[number];
export declare const ERP_MODULES: readonly ["identity", "rbac", "settings", "audit", "academics", "admissions", "cms", "students", "faculty", "timetable", "attendance", "hr", "payroll", "leave", "finance", "accounting", "exams", "lms", "library", "hostel", "documents", "certificates", "placement", "alumni", "inventory", "grievances", "events", "research", "sports", "safety", "reports", "ai", "migration", "notifications", "backup"];
export type ErpModule = (typeof ERP_MODULES)[number];
export type AccessScope = 'all' | 'department' | 'assigned' | 'own' | 'linked-student' | 'hostel' | 'pool-assigned';
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
export declare const DEFAULT_ROLE_TEMPLATES: RoleTemplateSeed[];
export declare function hasRolePermission(permissions: ModulePermissionRule[], moduleName: ErpModule, verb: PermissionVerb): ModulePermissionRule | undefined;
