# Master Product Requirements Document

## 1. Product summary
A single-college educational ERP for Centre for Advanced Studies, affiliated with AKTU, Lucknow. The solution is a responsive web portal built primarily with MERN, deployed cloud-first on AWS, bilingual English/Hindi, and released through a pilot plus phased enterprise rollout.

## 2. User groups
Planned configurable roles:
1. Super Admin (technical platform administration)
2. Principal / Director
3. College Administrator
4. HOD
5. Faculty / Teacher
6. Student
7. Parent / Guardian
8. Accountant
9. Admission Officer
10. Examination Controller
11. Librarian
12. Hostel Warden

Roles are templates, not hard-coded authority. Permissions must be configurable by module, action, record scope and organizational scope. Additional roles may be introduced after discovery. HR responsibilities can initially be assigned to authorized administrative roles unless a dedicated HR role is approved.

## 3. Functional scope
See `13_Functional_Module_PRDs.md` for detailed module requirements. Included:
- Academic management and AKTU-oriented configuration
- Admissions and public website/CMS
- Attendance for students and employees
- Employee HR, payroll and leave
- Student leave and permissions
- Fees, payments and accounting
- Examinations, results and timetable
- Library, hostel and mess
- Student/parent portal and LMS (basic)
- Documents and certificates
- Placement, career development and alumni
- Inventory, procurement and assets
- Grievance/helpdesk
- Events, sports and campus activities
- Research and innovation
- Basic safety and visitor register
- Reporting, analytics, AI assistance
- Backup, disaster recovery and operational administration

Transport management is excluded from the initial scope.

## 4. Core journeys
### Applicant to enrolled student
Public website → application → document upload → verification → merit/eligibility workflow → approval → fee payment → verified payment webhook/reconciliation → enrollment and student ID → portal activation.

### Student academic journey
Session/semester enrollment → subject registration → timetable → lecture-wise attendance → resources/assignments → internal/external assessment → verified result publication → backlog/revaluation if applicable → transcript/certificate request.

### Faculty journey
Secure login → assigned classes/subjects → timetable → lecture attendance → assignment/marks entry → moderation/approval → student communication → leave/workload/profile.

### Employee journey
Onboarding → profile/document verification → attendance/shift → leave → payroll preparation and approval → payslip → appraisal → exit/asset clearance.

### Finance journey
Fee structure → invoice/demand → payment/offline receipt → gateway verification → ledger posting → reconciliation → refund/adjustment approval → reports/audit.

### Grievance journey
Submission → privacy classification → restricted assignment → SLA tracking → human review and response → escalation/appeal → closure with audit history.

## 5. Non-functional requirements
- Security: least privilege, MFA options, secure sessions, encryption in transit/at rest, audit trail, secure development lifecycle.
- Performance: define measurable response-time and throughput SLOs after workload discovery; test enterprise-scale concurrency.
- Scalability: horizontal scaling, queues, caching where justified, database indexing and capacity monitoring.
- Availability: define uptime target, maintenance windows, RTO and RPO contractually.
- Accessibility: target WCAG 2.2 AA, subject to audit.
- Localization: English/Hindi, Unicode, locale-aware dates, numbers and currency.
- Compatibility: current supported desktop/mobile browsers; establish support matrix.
- Maintainability: modular code, API contracts, automated tests, observability and documentation.
- Portability: infrastructure-as-code and documented migration path; avoid unnecessary provider lock-in.

## 6. Release strategy
Phase 0 discovery and foundations; Phase 1 identity, organization, academic master data and migration tooling; Phase 2 admissions, student records, attendance, fees and portals; Phase 3 exams, timetable, HR/payroll, accounting and library; Phase 4 hostel, placements, alumni, inventory, grievances, events, research, sports, safety and visitor; Phase 5 analytics/AI expansion and optimization. Exact ordering is validated in the delivery plan. Pilot selected departments/users before progressive rollout.

## 7. Acceptance principles
A feature is accepted only when:
- Requirements and permissions are traceable.
- Real persisted data is used; no fake success or mock production behavior.
- Positive, negative, boundary and authorization tests pass.
- Audit events are generated for sensitive actions.
- User acceptance is signed off by designated institutional owners.
- Documentation, support and rollback procedures exist.
- Security, privacy, performance and accessibility gates pass as applicable.

## 8. Open decisions
Existing ERP vendor/schema; exact program catalogue; domain/brand assets; provider accounts; hardware; statutory rules; official integration permissions; measurable SLO/RTO/RPO; support SLAs; legal and contract terms.
