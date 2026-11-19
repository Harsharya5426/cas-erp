# Existing Data Migration PRD

## Source
Institution confirmed an existing ERP or database, but vendor, technology, schema and access method are not yet known.

## Discovery
Inventory databases, files, document stores, interfaces, data owners, record counts, data quality, identifiers, retention requirements and legal restrictions. Obtain approved read-only extracts and data dictionary.

## Migration process
1. Source assessment and profiling.
2. Target mapping and transformation specification.
3. Data cleansing, normalization and duplicate resolution.
4. Trial migration into isolated staging.
5. Referential integrity and reconciliation by entity and totals.
6. Business-owner sampling and sign-off.
7. Cutover plan with freeze window, delta migration and rollback.
8. Post-cutover reconciliation and controlled source archival.

## Controls
Preserve source IDs and lineage; log rejected rows with reasons; encrypt transfers; restrict access; hash/checksum files; do not silently discard ambiguous records. Migrate documents with metadata and permissions. Do not use production data in testing without approval and safeguards.

## Acceptance
Reconciliation thresholds and exception handling must be approved per dataset. Critical student, employee, fee, payment, result and attendance records require explicit validation and sign-off.
