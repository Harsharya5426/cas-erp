# Backend and API PRD

## Architecture
MERN-first modular monolith is a suitable initial baseline: React client, Node.js/Express API, MongoDB/Mongoose. Extract services only when operationally justified. ML capabilities may be isolated in Python services behind authenticated internal APIs.

## API conventions
Versioned REST API (for example `/api/v1`); OpenAPI specification; consistent pagination, filtering, sorting, error schema, request IDs and idempotency keys for financial operations. Validate all input server-side and normalize errors without leaking secrets.

## Domain modules
Identity/access, organization/master data, academics, admissions, attendance, fees/finance, examinations, timetable, HR, library, hostel, documents, placement/alumni, inventory, grievances, events, research, sports, safety/visitors, communications, reporting and integrations.

## Reliability
Timeouts, retries with backoff, circuit breakers where appropriate, queue-based long-running tasks, dead-letter handling, idempotency, transactional boundaries and reconciliation jobs. Do not rely on frontend-only validation.

## Security
Short-lived access tokens and controlled refresh/session rotation; secure cookie strategy where appropriate; MFA; CSRF protection where applicable; CORS allowlist; rate limiting; request validation; output encoding; upload scanning; secrets manager; audit logs; least-privilege service identities.

## API documentation
Maintain schemas, examples, auth scopes, error codes, rate limits, versioning/deprecation policy and integration test suites. Never expose internal endpoints or administrative capabilities to public clients.
