# CAS ERP — Requirements Traceability Matrix (Implemented Baseline)

| PRD / Req | Capability | Implemented Code & Persistence | Verification |
|---|---|---|---|
| `00` Vision & `01` Master | Configurable CAS AKTU ERP, EN/HI, INR, DD-MM-YYYY IST, Synthetic placeholders | `packages/shared/src/formatters.ts`, `apps/api/src/modules/org/`, `apps/api/src/scripts/seed.ts` | `@cas-erp/shared` unit tests, API tests |
| `02` Roles & Permissions | 12 Configurable Role Templates, Scoped RBAC/ABAC, Approval Workflows, SoD | `packages/shared/src/rbac.ts`, `apps/api/src/core/rbac.ts`, `apps/api/src/core/workflow.ts`, `apps/api/src/modules/identity/` | API integration tests (403 checks, SoD checks) |
| `03` UI/UX & Accessibility | Dark/Light/System theme, Accent picker, WCAG 2.2 AA landmarks/focus/reduced-motion, Native EN/HI | `apps/web/src/i18n/index.js`, `apps/web/src/index.css`, `apps/web/src/components/Navbar.jsx`, `apps/web/src/views/SettingsView.jsx` | Vite build + Playwright `@axe-core/playwright` |
| `04` Attendance & ML | Lecture Manual/QR/RFID attendance, idempotency, corrections, shortage alerts, policy-gated biometrics | `apps/api/src/modules/attendance/`, `apps/web/src/views/AttendanceGradesView.jsx`, `FaceAttendanceView.jsx` | API test (policy block, QR idempotency, correction approval) |
| `05` Backend API | Express 5 `/api/v1` modular monolith, Zod validation, Pino log redaction, `/healthz`, `/readyz`, OpenAPI 3.1 | `apps/api/src/app.ts`, `core/errors.ts`, `core/logger.ts`, `core/requestContext.ts` | API integration tests |
| `06` Database | Mongoose schemas, UTC storage, IST display, append-only `AuditEvent` & `LedgerEntry`, `sourceSystemRef` | `apps/api/src/modules/*/models.ts`, `apps/api/src/core/audit.ts` | Mongoose pre-hook append-only tests |
| `07` Integrations | Cashfree order/verify/HMAC webhooks, S3/local private upload + magic-byte scan, Comms & SSO adapters | `apps/api/src/adapters/cashfree.ts`, `storage.ts`, `comms.ts` | Cashfree HMAC signature & replay tests |
| `08` Security & Privacy | Scrypt password hashing, lockout, TOTP MFA + recovery codes, rotating HttpOnly sessions, confidential grievances | `apps/api/src/core/crypto.ts`, `modules/identity/service.ts`, `modules/campus/routes.ts` | Auth lockout, MFA, confidential isolation tests |
| `09` Testing & DevSecOps | Zero high/crit npm audit, Vitest unit/API, Playwright E2E + axe, GitHub CI workflow | `.github/workflows/ci.yml`, `apps/api/src/__tests__/`, `tests/e2e/` | CI pipeline & local test execution |
| `10` AWS & DR | Portable Dockerfiles, Compose, AWS Terraform (`ap-south-1` default, S3/KMS/Secrets/SQS/ECS), DR drill script | `infra/`, `scripts/verify-backup-restore.mjs`, `docs/runbooks/OPERATIONS_AND_DR.md` | `npm run verify:dr` |
| `11` Data Migration | Source profiling, dry-run rejections log, SHA-256 checksums, commit lineage | `apps/api/src/modules/org/routes.ts` (`/migration/batches`), `ReportsAiAdminView.jsx` | API migration dry-run/commit test |
| `12` Reporting & AI | Audited CSV exports, Advisory-only AI assistant + Python FastAPI ML bridge + kill switch | `apps/api/src/modules/reports/routes.ts`, `services/ml/main.py`, `ReportsAiAdminView.jsx` | API + Python syntax check |
| `13` 25 Modules | Academics, AKTU Config, Admissions/CMS, Attendance, HR/Payroll/Leave, Finance/Accounting, Exams/LMS, Library, Hostel, Portals, Certificates/QR, Placement/Alumni, Inventory, Grievances, Events/Research/Safety/Visitor | `apps/api/src/modules/*`, `apps/web/src/views/*` | API + Web build + E2E |

