import { AKTU_GRADE_POINTS } from './constants.js';
export function formatINR(amount) {
    if (amount === undefined || amount === null || amount === '')
        return '₹0';
    const num = Number(amount);
    if (Number.isNaN(num))
        return '₹0';
    return '₹' + num.toLocaleString('en-IN');
}
export function formatLakhsCrores(amount) {
    const num = Number(amount);
    if (Number.isNaN(num))
        return '₹0';
    if (Math.abs(num) >= 10000000) {
        return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
        return `₹${(num / 100000).toFixed(2)} L`;
    }
    return formatINR(num);
}
/**
 * Formats an ISO/Date timestamp into DD-MM-YYYY in Asia/Kolkata (IST) per PRD 01/06.
 */
export function formatDateIST(input) {
    if (!input)
        return '—';
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime()))
        return '—';
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.day}-${map.month}-${map.year}`;
}
export function formatDateTimeIST(input) {
    if (!input)
        return '—';
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime()))
        return '—';
    const datePart = formatDateIST(d);
    const timePart = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(d);
    return `${datePart} ${timePart} IST`;
}
export function calculateSGPA(items) {
    let totalPoints = 0;
    let totalCredits = 0;
    let earnedCredits = 0;
    for (const item of items) {
        const cr = Number(item.credits) || 0;
        const gp = AKTU_GRADE_POINTS[item.grade] ?? 0;
        totalPoints += gp * cr;
        totalCredits += cr;
        if (gp > 0)
            earnedCredits += cr;
    }
    const sgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
    return { sgpa, totalCredits, earnedCredits };
}
export function getCGPABadge(cgpa) {
    const score = Number(cgpa);
    if (score >= 9.0)
        return { label: 'Outstanding (O)', color: 'badge-purple' };
    if (score >= 8.0)
        return { label: 'Distinction (A+)', color: 'badge-success' };
    if (score >= 7.0)
        return { label: 'First Class (A)', color: 'badge-info' };
    if (score >= 6.0)
        return { label: 'Second Class (B)', color: 'badge-warning' };
    return { label: 'Pass / Remedial', color: 'badge-danger' };
}
//# sourceMappingURL=formatters.js.map