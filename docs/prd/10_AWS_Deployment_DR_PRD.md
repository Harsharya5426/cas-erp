# AWS Deployment, Operations and Disaster Recovery PRD

## Deployment
AWS selected as preferred cloud. Use infrastructure-as-code and a documented, portable architecture. Evaluate AWS India regions for latency and residency needs; validate service availability, backups, logs, support access, subprocessors and cross-region replication before making residency claims.

## Reference architecture
React static frontend behind CDN/WAF; Express API behind load balancer; managed MongoDB service or approved MongoDB deployment; private networking; object storage for documents; managed secrets and keys; queue workers for notifications/reports; centralized metrics/logging/tracing; WAF, rate limiting and DDoS protections. Final service choices require cost, security and data-location review.

## Environments
Separate development, staging and production accounts/projects or equivalent isolation. No production secrets in developer environments. Use least-privilege IAM, private subnets where applicable, controlled egress and administrative access logging.

## DevSecOps
Docker, CI/CD, GitHub, automated tests/scans, IaC, approval gates, rollback, vulnerability remediation and release notes.

## Operations
24/7 monitoring was selected as managed-service expectation. Define on-call ownership, incident severity, support hours, response/resolution SLAs, maintenance windows, patch cadence and escalation contractually.

## Business continuity
Encrypted automated backups, snapshots, point-in-time recovery where supported, geographically separate copies where legally and operationally appropriate, HA/failover, restore testing and documented recovery drills. Agree RTO/RPO before production; do not invent targets.
