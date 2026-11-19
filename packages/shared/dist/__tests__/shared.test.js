import { describe, expect, it } from 'vitest';
import { DEFAULT_ROLE_TEMPLATES, ROLE_KEYS, calculateSGPA, formatDateIST, formatINR, hasRolePermission } from '../index.js';
describe('@cas-erp/shared', () => {
    it('defines all 12 PRD role templates', () => {
        expect(DEFAULT_ROLE_TEMPLATES).toHaveLength(12);
        const keys = DEFAULT_ROLE_TEMPLATES.map((r) => r.key);
        expect(keys).toEqual([...ROLE_KEYS]);
    });
    it('enforces segregation of duties on Super Admin vs confidential grievances', () => {
        const superAdmin = DEFAULT_ROLE_TEMPLATES.find((r) => r.key === 'SUPER_ADMIN');
        expect(hasRolePermission(superAdmin.permissions, 'grievances', 'view')).toBeUndefined();
        expect(hasRolePermission(superAdmin.permissions, 'exams', 'publish')).toBeUndefined();
        expect(hasRolePermission(superAdmin.permissions, 'rbac', 'manage-users')).toBeDefined();
    });
    it('formats INR and IST DD-MM-YYYY dates accurately', () => {
        expect(formatINR(165000)).toBe('₹1,65,000');
        // 2026-11-10T20:00:00.000Z is 2026-11-11 01:30 IST
        expect(formatDateIST('2026-11-10T20:00:00.000Z')).toBe('11-11-2026');
    });
    it('computes 10-point SGPA accurately', () => {
        const result = calculateSGPA([
            { credits: 4, grade: 'O' },
            { credits: 4, grade: 'A+' }
        ]);
        expect(result.sgpa).toBe(9.5);
        expect(result.totalCredits).toBe(8);
        expect(result.earnedCredits).toBe(8);
    });
});
//# sourceMappingURL=shared.test.js.map