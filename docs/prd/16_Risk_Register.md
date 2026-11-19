# Initial Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Scope too large for one build | High | Phased roadmap, traceability, release gates |
| Poor source data quality | High | Profiling, trial migration, reconciliation, sign-off |
| Unverified AKTU interfaces | High | Do not assume API access; use approved imports until authorized |
| Biometric privacy/accuracy | High | Privacy assessment, alternative methods, human review, retention controls |
| Developer-owned source code | High | Contractual data ownership, export, backups, transition and continuity rights |
| Payment webhook/reconciliation defects | High | Server verification, signatures, idempotency, reconciliation tests |
| Excessive privileged access | High | Least privilege, segregation of duties, access reviews, audit |
| AI error or bias | High | Advisory-only use, evaluation, human approval and disable switch |
| Cloud residency assumptions | High | Full data-flow/subprocessor review; region validation |
| Payroll/tax rule changes | Medium/High | Configurable rules and expert validation |
| Integration vendor outage | Medium | Retry, queues, fallback/manual process and monitoring |
| Scope creep | High | Change control and prioritized backlog |
