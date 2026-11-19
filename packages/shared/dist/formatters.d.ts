export declare function formatINR(amount: number | string | null | undefined): string;
export declare function formatLakhsCrores(amount: number | string | null | undefined): string;
/**
 * Formats an ISO/Date timestamp into DD-MM-YYYY in Asia/Kolkata (IST) per PRD 01/06.
 */
export declare function formatDateIST(input: Date | string | number | null | undefined): string;
export declare function formatDateTimeIST(input: Date | string | number | null | undefined): string;
export declare function calculateSGPA(items: Array<{
    credits: number;
    grade: string;
}>): {
    sgpa: number;
    totalCredits: number;
    earnedCredits: number;
};
export declare function getCGPABadge(cgpa: number | string): {
    label: string;
    color: string;
};
