# Database and Data Architecture PRD

## MongoDB baseline
Use Mongoose schemas with explicit validation, indexes, timestamps, controlled migrations and documented collection ownership. Avoid unbounded embedded arrays. Use references for independently managed entities and denormalized read models only with consistency rules.

## Core entities
Institution, campus, department, program, course, academicSession, semester, batch, section, subject, facultyAssignment, student, guardianLink, employee, applicant, enrollment, attendanceEvent, attendanceSummary, feePlan, invoice, payment, refund, ledgerEntry, exam, assessment, marks, result, timetableSlot, leaveRequest, document, certificate, libraryItem, circulationRecord, hostel, room, bedAllocation, grievance, asset, vendor, procurement, placementDrive, alumniProfile, event, researchProject, notification, approvalWorkflow, auditEvent.

## Data rules
Use stable internal IDs; separate human-readable identifiers; define uniqueness and duplicate detection; store timestamps in UTC and render in Asia/Kolkata; preserve source-system IDs during migration; define retention and archival. Financial records must be append-only or corrected through reversal/adjustment rather than silent overwrite.

## Indexing and scale
Index common lookup, join/reference, date-range and reporting paths; use compound indexes based on query plans; monitor index size and slow queries. Validate workload with representative load tests. Define sharding only if measured requirements justify it.

## Backup and recovery
Encrypted automated backups, point-in-time recovery where supported, isolated copies, tested restore procedures, access separation and backup integrity checks. Define RPO/RTO with stakeholders.
