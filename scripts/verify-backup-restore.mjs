/**
 * CAS ERP Disaster Recovery — Backup & Restore Verification Script
 * Implements Acceptance Criteria Journey #12 ("Backup is restored into a test environment and validated")
 * Uses Mongoose JSON snapshot + SHA-256 integrity checks + isolated DB restore verification.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';

const SOURCE_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cas_erp_dev';
const VERIFY_DB_NAME = `cas_erp_dr_verify_${process.pid}_${Date.now()}`;
const VERIFY_URI = SOURCE_URI.replace(/\/[^/?]+(\?|$)/, `/${VERIFY_DB_NAME}$1`);

async function run() {
  const startedAt = Date.now();
  const backupDir = path.resolve('storage', 'dr-snapshots', `snapshot-${Date.now()}`);
  await fs.mkdir(backupDir, { recursive: true });

  // 1. Connect to source database and snapshot all collections with SHA-256 checksums
  const srcConn = await mongoose.createConnection(SOURCE_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
  const collections = await srcConn.db.listCollections().toArray();

  const manifest = [];
  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;
    const docs = await srcConn.db.collection(colName).find({}).toArray();
    const jsonPayload = JSON.stringify(docs);
    const sha256 = crypto.createHash('sha256').update(jsonPayload).digest('hex');
    const filePath = path.join(backupDir, `${colName}.json`);
    await fs.writeFile(filePath, jsonPayload, 'utf8');
    manifest.push({ collection: colName, count: docs.length, sha256 });
  }
  await srcConn.close();

  // 2. Restore snapshot into isolated test verification database
  const dstConn = await mongoose.createConnection(VERIFY_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
  const verifyResults = [];

  try {
    for (const entry of manifest) {
      const raw = await fs.readFile(path.join(backupDir, `${entry.collection}.json`), 'utf8');
      const actualHash = crypto.createHash('sha256').update(raw).digest('hex');
      if (actualHash !== entry.sha256) {
        throw new Error(`Checksum mismatch during DR restore for ${entry.collection}`);
      }
      const docs = JSON.parse(raw);
      if (docs.length > 0) {
        await dstConn.db.collection(entry.collection).insertMany(docs);
      }
      const restoredCount = await dstConn.db.collection(entry.collection).countDocuments();
      if (restoredCount !== entry.count) {
        throw new Error(`Row count mismatch on ${entry.collection}: expected ${entry.count}, got ${restoredCount}`);
      }
      verifyResults.push({ collection: entry.collection, count: restoredCount, verified: true });
    }

    // 3. Validate critical double-entry accounting invariant in restored DB
    const ledgerDocs = await dstConn.db.collection('ledgerentries').find({}).toArray();
    for (const l of ledgerDocs) {
      if (Number(l.totalDebitInr) !== Number(l.totalCreditInr)) {
        throw new Error(`Ledger imbalance detected after restore on voucher ${l.voucherNo}`);
      }
    }

    const rtoMs = Date.now() - startedAt;
    console.log(
      JSON.stringify(
        {
          status: 'DR_RESTORE_VERIFIED',
          sourceUriDb: SOURCE_URI.split('/').pop(),
          restoredVerifyDb: VERIFY_DB_NAME,
          collectionsVerified: verifyResults.length,
          ledgerEntriesChecked: ledgerDocs.length,
          rtoMs
        },
        null,
        2
      )
    );
  } finally {
    await dstConn.db.dropDatabase();
    await dstConn.close();
    await fs.rm(backupDir, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error('DR verification failed:', err);
  process.exit(1);
});

