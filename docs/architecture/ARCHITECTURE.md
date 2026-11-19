# CAS ERP Architecture & Engineering Reference

## 1. Stack & Monorepo Structure
- **`packages/shared` (`@cas-erp/shared`)**: Canonical 12-role RBAC templates (`DEFAULT_ROLE_TEMPLATES`), permission verbs, error codes, IST `DD-MM-YYYY` / INR formatters, SGPA calculator, and Zod validation primitives.
- **`apps/api` (`@cas-erp/api`)**: Node.js + Express 5 modular monolith (`/api/v1`), Mongoose 8 schemas, Argon/Scrypt password hashing, TOTP MFA, rotating `HttpOnly` refresh cookies, scoped ABAC enforcement, append-only `AuditEvent` & `LedgerEntry` collections, Cashfree HMAC webhook handler, and OpenAPI 3.1 contract (`/api/v1/openapi.json`).
- **`apps/web` (`@cas-erp/web`)**: React 19 + Vite 8 + Tailwind CSS portal with native EN/HI `i18next` localization, `light|dark|system` theme + accessible accent preferences, WCAG 2.2 AA landmarks/focus/reduced-motion, and a Public Admissions & QR Verification portal.
- **`services/ml`**: Optional isolated Python FastAPI advisory service behind `X-Internal-Service-Token`.
- **`infra/`**: Non-root Dockerfiles, `docker-compose.yml`, and AWS Terraform (`ap-south-1` default) with private S3, KMS, Secrets Manager, SQS+DLQ, and ECS.

## 2. Non-Negotiable Safeguards Implemented
- **Server-Side Scoped RBAC/ABAC**: Client UI never enforces security alone; every `/api/v1` route validates JWT + active session + role template + scope (`all`, `department`, `assigned`, `own`, `linked-student`, `hostel`, `pool-assigned`).
- **Segregation of Duties (SoD)**: Super Admin cannot view confidential grievances or unilaterally publish marks/refunds; preparers cannot self-approve payroll or fee refunds; Faculty cannot publish final results.
- **Biometric & AI Governance**: Facial recognition attendance is hard-gated behind `BIOMETRIC_POLICY_APPROVED=true` and `InstitutionSettings.biometrics.privacyAssessmentApproved=true`. Manual, QR, and RFID attendance remain active without penalty. AI features are strictly advisory with human approval required.
- **Append-Only Audit & Ledger**: Mongoose pre-hooks block `update*` and `delete*` operations on `AuditEvent` and `LedgerEntry` (`debit === credit` invariant enforced before persistence).

## 3. Known Limitations & Pending Institutional Discovery
Refer to `docs/prd/15_Open_Questions_and_Discovery.md` and `docs/prd/19_Configuration_Checklist.md`. Until institutional credentials and verified catalogues are supplied:
1. Initial academic departments, programs, subjects, and users are clearly flagged synthetic placeholders (`isSyntheticPlaceholder: true`).
2. Cashfree, Email/SMS/WhatsApp, Google/Microsoft SSO, and AKTU interfaces run in disabled/sandbox adapter mode.
3. Hardware biometric/RFID gateways require device vendor SDK details from institutional discovery.

