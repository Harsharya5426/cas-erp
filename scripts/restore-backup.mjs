/**
 * CAS ERP Automated Database Restore Utility
 * Restores a snapshot created by scripts/create-backup.mjs into the target MongoDB instance.
 * Usage:
 *   node scripts/restore-backup.mjs <backup-directory-or-latest>
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cas_erp_dev';

async function restore() {
  const backupsBase = path.resolve('storage', 'backups');
  let targetDir = process.argv[2];

  if (!targetDir || targetDir === 'latest') {
    const list = await fs.readdir(backupsBase);
    const sorted = list.filter((f) => f.startsWith('cas-erp-backup-')).sort();
    if (sorted.length === 0) {
      throw new Error('No backups found in storage/backups.');
    }
    targetDir = path.join(backupsBase, sorted[sorted.length - 1]);
  } else if (!path.isAbsolute(targetDir)) {
    targetDir = path.resolve(backupsBase, targetDir);
  }

  console.log(`🔍 Restoring from snapshot: ${targetDir}`);
  const manifestRaw = await fs.readFile(path.join(targetDir, 'manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw);

  const conn = await mongoose.createConnection(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).asPromise();
  console.log(`🔄 Connected to database: ${conn.name}. Restoring ${manifest.collections.length} collections...`);

  let restoredDocs = 0;
  for (const item of manifest.collections) {
    const jsonStr = await fs.readFile(path.join(targetDir, `${item.collection}.json`), 'utf8');
    const hash = crypto.createHash('sha256').update(jsonStr).digest('hex');

    if (hash !== item.sha256) {
      throw new Error(`SHA-256 integrity check failed for collection: ${item.collection}`);
    }

    const docs = JSON.parse(jsonStr);
    if (docs.length > 0) {
      // Clear existing records before restoring to avoid duplicate key conflicts
      await conn.db.collection(item.collection).deleteMany({});
      await conn.db.collection(item.collection).insertMany(docs);
    }
    restoredDocs += docs.length;
  }

  await conn.close();

  console.log('====================================================');
  console.log('✅ RESTORE COMPLETE & VERIFIED!');
  console.log(`📊 Restored Collections: ${manifest.collections.length}`);
  console.log(`📄 Restored Documents: ${restoredDocs}`);
  console.log('====================================================');
}

restore().catch((err) => {
  console.error('❌ Restore failed:', err.message);
  process.exit(1);
});
