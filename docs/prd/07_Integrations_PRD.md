# Integration Requirements

## Cashfree Payments
Primary gateway selection: Cashfree Payments. Use provider-supported hosted/secure checkout and official SDK/API versions. Verify payment status server-to-server and validate webhook signatures using current official documentation. Make webhook processing idempotent; reconcile orders, payments, refunds and settlements. Never treat a browser redirect as proof of payment. Do not store card data. Credentials live in AWS Secrets Manager or equivalent. Merchant account, enabled methods, production approval and test credentials are institution-supplied.

## Communications
Support adapters for email, SMS and WhatsApp Business API, plus in-app notifications and browser push. Providers/accounts are undecided. Record delivery state, retries, templates, consent/preferences, opt-out where required and provider message IDs. Avoid sending sensitive records in message body; use authenticated portal links.

## Identity
Google/Microsoft SSO may be enabled after tenant approval and configuration. Preserve local recovery/admin access under controlled policy.

## Biometrics and devices
Integrate only supported hardware through documented vendor SDK/API or secure gateway. Device procurement and exact models are discovery items.

## Accounting and external systems
Provide documented adapters/import-export for accounting software and official university/government interfaces where available. Do not scrape or assume AKTU access. Require written authorization and supported APIs.

## Storage
Use private object storage, signed short-lived access URLs, malware scanning, content-type/size restrictions and retention policies.

## Integration governance
Maintain a registry of provider, owner, purpose, data exchanged, legal basis, credentials owner, rate limits, failure mode, data location, subprocessors and renewal dates.
