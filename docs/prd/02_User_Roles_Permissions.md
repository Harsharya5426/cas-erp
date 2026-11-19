# Roles, Permissions and Approval Model

## Authorization model
Use RBAC plus scoped attributes (department, program, batch, subject, campus, record ownership). Enforce authorization server-side on every API request; frontend hiding is not security.

Permission verbs: view, create, edit, delete/void, submit, approve, reject, publish, export, configure, manage-users. Sensitive actions may require step-up authentication and dual approval.

## Role templates
- Super Admin: infrastructure, configuration and user administration. Technical authority does not automatically confer unrestricted access to sensitive academic, HR, grievance or financial content.
- Principal/Director: institution-level oversight and designated approvals.
- College Administrator: delegated operational administration.
- HOD: department-scoped academic and personnel workflows.
- Faculty: assigned subjects/classes, attendance, assessments and student communication.
- Student: own academic, attendance, fee, timetable, documents and requests.
- Parent/Guardian: verified linked-student view limited by consent/authority and policy.
- Accountant: fee, receipts, ledgers and finance workflows within assigned scope.
- Admission Officer: applicant and admission workflow.
- Examination Controller: exam operations, marks verification, result preparation/publication controls.
- Librarian: library catalogue and circulation.
- Hostel Warden: hostel allocation, attendance, outpass and facility operations.

## Approval workflows
Configurable, versioned workflow engine. Example paths:
- Admissions: Admission Officer → delegated verifier → authorized approver.
- Leave: Employee/Student → reporting authority/HOD → authorized final approver.
- Marks: Faculty submission → department/exam verification → authorized result publication.
- Refunds: Accountant preparation → independent authorized approver.
- Procurement: requester → budget owner → purchase approver → receiving confirmation.
- Certificates: applicant → record verifier → authorized signer.
No approval chain should be assumed immutable; institution must configure and sign off.

## Controls
Segregation of duties for finance and results; no self-approval for high-risk transactions; delegated authority with expiry; access reviews; emergency break-glass access with reason and audit; periodic dormant-account review; parent relationship verification and revocation.
