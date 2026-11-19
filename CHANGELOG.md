# Changelog

All notable changes to the **Centre for Advanced Studies (AKTU Lucknow) Educational ERP (`cas.erp`)** are documented in this file.

## [2.0.0] - 2026-11-11
### Added (PRD-Driven MERN Upgrade)
- **Monorepo Workspace Architecture**: Organized into `@cas-erp/shared`, `@cas-erp/api`, `@cas-erp/web`, `services/ml`, `infra/`, `docs/prd/`, `docs/architecture/`, and `docs/runbooks/`.
- **Identity, Security & 12-Role Scoped RBAC**: Replaced client-side mock auth with Express + Mongoose persistence, `scrypt` password hashing, account lockout, TOTP RFC 6238 MFA + recovery codes, rotating `HttpOnly` refresh cookies, break-glass emergency logging, and configurable 12-role RBAC + ABAC scopes + versioned approval workflows.
- **Core & Pilot Modules**: Public bilingual Website/CMS & online admissions + tracking + enrollment conversion; configurable Institution -> Department -> Program -> Subject hierarchy; conflict-checked Timetable; Lecture & Employee Attendance (Manual, QR session check-in, RFID/device ingest, correction appeals, shortage alerts, and policy-gated biometric safeguards); Unified Employee/Student Leave & Hostel Outpass; Cashfree Payments server-verified checkout + HMAC-SHA256 idempotent webhooks + offline receipts + append-only double-entry `LedgerEntry` vouchers.
- **Academic, HR & Campus Ecosystem**: Exam schedules, marks moderation, audit-locked SGPA/CGPA publication, revaluation, Basic LMS, Payroll runs, Library circulation, Hostel & Mess allocations, Private document storage + QR-verifiable certificates, Confidentiality-isolated Grievance & Helpdesk, Placement & Alumni, Inventory & 2-step Procurement, Events, Research, Safety & minimal-PII Visitor Register, Audited CSV Exports, and Governed Advisory AI + Python FastAPI ML sidecar.
- **UI/UX & Bilingual Support**: Removed Bootstrap CDN, Tailwind runtime CDN, and external Google Translate script; implemented native `i18next` English/Hindi localization, `Noto Sans Devanagari`, `DD-MM-YYYY` (`Asia/Kolkata`) & `INR` formatting, WCAG 2.2 AA landmarks/focus/reduced-motion, and directional entrance animations across login, public portal, and ERP pages.
- **DevSecOps, AWS IaC & DR**: Added GitHub Actions CI/CD, non-root Dockerfiles & Compose, AWS Terraform IaC (`ap-south-1` default), automated backup/restore DR verification script (`npm run verify:dr`), Vitest unit/integration suites, and Playwright + `axe-core` E2E tests.

