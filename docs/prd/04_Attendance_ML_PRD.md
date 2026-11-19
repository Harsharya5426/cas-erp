# Attendance and ML Requirements

## Student attendance
Lecture-wise, subject-wise and semester-wise attendance. Faculty marks attendance for assigned classes. Support correction requests, approval history, configurable shortage thresholds, defaulter reports and student/parent notifications. No default full-day attendance substitution.

## Employee attendance
Check-in/out and multiple punches; configurable shifts, breaks, grace periods, late/early rules, overtime, working-hour calculations, holidays, leave integration and monthly summaries. Rules must be configurable and reviewed by HR/authorized administrators.

## Capture methods
Support manual faculty entry, QR, RFID/smart ID, approved biometric devices and optional face matching through adapters. A method may be disabled by institution policy or hardware availability.

## Biometric safeguards
- Provide a practical non-biometric alternative without penalty.
- Give clear notice and obtain consent or another lawful basis as applicable.
- Complete privacy/legal assessment before activation.
- Prefer protected templates and avoid retaining raw face images unless specifically justified and approved.
- Restrict access, encrypt data, define retention/deletion, log access and vendor processing.
- Human review for uncertain matches; provide correction and appeal.
- Evaluate accuracy across relevant populations and operating conditions before deployment.
- Never use a biometric match alone for disciplinary action or denial of rights.

## ML lifecycle
Document model purpose, training/validation data provenance, performance, known limitations, drift monitoring, versioning, human override, incident handling and rollback. Do not infer sensitive attributes. ML outputs are advisory and must not autonomously decide grades, admission, employment, discipline or grievance outcomes.

## Acceptance
Validate capture-device integration in a controlled pilot; test manual fallback, duplicate-event handling, offline/retry behavior, corrections, authorization, audit and reporting.
