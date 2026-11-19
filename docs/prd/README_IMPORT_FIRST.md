# Centre for Advanced Studies — ERP PRD Import Package

## Import into Google Antigravity
1. Download and extract this ZIP.
2. Open the extracted folder as the project workspace in Antigravity, or copy the Markdown files into the workspace's `docs/` directory.
3. Start with `18_Antigravity_Master_Build_Instructions.md`.
4. Ask Antigravity to read the complete `docs/` folder and produce the architecture, requirements traceability matrix, delivery backlog, risk register, and implementation plan **before writing application code**.
5. Review and approve the plan. Build in vertical slices and phases; do not attempt the entire ERP in one generation.

## Package contents
- Product vision and master PRD
- Functional module specifications
- Roles and permissions
- UI/UX, API, database and integration requirements
- Security, privacy, biometric/ML governance
- Testing, DevSecOps, AWS deployment and disaster recovery
- Data migration and acceptance criteria
- Antigravity build instructions

## Project facts
- Institution: Centre for Advanced Studies
- Affiliation: Dr. A.P.J. Abdul Kalam Technical University (AKTU)
- Campus/location: AKTU Main Campus, Sector 11, Jankipuram Extension, Lucknow, Uttar Pradesh, India
- Initial deployment: one college / one campus
- Currency: INR; timezone: Asia/Kolkata; date format: DD-MM-YYYY
- Languages: English and Hindi
- Stack preference: MERN (React, Node.js, Express, MongoDB/Mongoose); separate Python service may be used for ML
- Cloud preference: AWS, cloud-first and portable
- Existing institutional domain; exact domain to be supplied
- Payment gateway: Cashfree Payments
- Delivery: pilot followed by phased enterprise rollout
- Source-code ownership selection: developer-owned project. Contract must explicitly protect institutional data ownership/access, export, backup, termination and transition rights.

## Important assumptions and items requiring discovery
This is a requirements package, not an assertion that the institution's current systems, courses, policies, approvals, credentials or integrations have been verified. Confirm:
- Existing ERP/database vendor, schema, data formats, data volumes and access
- Exact domain, logo, brand guide and authorized signatories
- Actual programs, branches, curriculum, credit structures and current AKTU rules
- AWS region and data-residency/legal review, including subprocessors and cross-border processing
- Cashfree merchant account, enabled payment methods, webhook configuration and settlement/reconciliation process
- SMS, email and WhatsApp Business providers/accounts
- Biometric/face attendance hardware, lawful basis, consent, alternatives and retention policy
- Official AKTU/government APIs and written access permissions
- RTO/RPO, service-level targets, concurrency/load targets and support contract
- Payroll, tax, accounting and certificate-signing rules validated by qualified institutional personnel

## Non-negotiable product principles
- No fake buttons, placeholder success states, dead links or simulated production functions.
- No secrets in source code, prompts, logs or committed configuration.
- Human review for high-impact AI outputs; AI must not autonomously decide admission, grades, discipline, employment or grievances.
- Biometric attendance must have a usable non-biometric alternative, transparent notice, restricted access, retention/deletion controls and human correction/appeal.
- Every privileged action and financial/academic change must be auditable.
- Build accessible, responsive, bilingual experiences.
- Treat this project as staged enterprise delivery, not a one-shot code-generation task.
