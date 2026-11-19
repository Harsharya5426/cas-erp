# Security, Privacy and Governance PRD

## Security baseline
Threat-model the system and APIs. Apply OWASP ASVS/Top 10 guidance, secure coding, dependency scanning, SAST/DAST, secret scanning, container/IaC scanning, patch management and penetration testing by qualified professionals.

## Identity and access
Password hashing with a modern adaptive algorithm; MFA/OTP options; optional approved SSO; session expiry and revocation; device/session visibility; account lockout and abuse detection. Enforce least privilege and server-side authorization.

## Data protection
TLS in transit; encryption at rest; managed key rotation; field-level protection for especially sensitive values; minimize collection; classify data; mask sensitive values in logs; restrict exports; maintain access and change audits.

## Indian context
Conduct legal review for applicable Indian data-protection, cybersecurity, education, tax and record-retention obligations. Do not assume a specific legal basis or blanket consent suffices. Confirm current rules, notices, grievance channels, processor contracts, breach response, retention and cross-border transfer requirements with qualified counsel. AWS region selection alone does not prove all processing remains in India; review subprocessors and data flows.

## High-risk information
Biometric, financial, HR, student and confidential grievance records receive stricter access, retention and audit. Parent access must be relationship-verified and policy-scoped.

## AI governance
Disclose AI-assisted features, minimize prompt data, prevent unauthorized retrieval, log model/version and human review, test hallucination and bias risks, and provide correction/escalation. Never automate high-impact decisions.

## Incident response
Document severity levels, containment, evidence preservation, notification decision process, recovery, root-cause analysis and post-incident actions. Restrict incident logs to authorized responders.
