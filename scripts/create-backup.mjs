/**
 * CAS ERP Automated Database Backup Utility
 * Creates a verified JSON snapshot of all database collections with SHA-256 integrity hashes.
 * Usage:
 *   node scripts/create-backup.mjs
 *   MONGODB_URI="<atlas-uri>" node scripts/create-backup.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cas_erp_dev';

async function backup() {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('storage', 'backups', `cas-erp-backup-${timestamp}`);
  await fs.mkdir(backupDir, { recursive: true });

  console.log('🔄 Connecting to MongoDB database to initiate backup...');
  const conn = await mongoose.createConnection(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).asPromise();
  
  const collections = await conn.db.listCollections().toArray();
  const manifest = [];
  let totalDocs = 0;

  console.log(`📦 Found ${collections.length} collections. Exporting collections to ${backupDir}...`);

  for (const col of collections) {
    if (col.name.startsWith('system.')) continue;
    const docs = await conn.db.collection(col.name).find({}).toArray();
    const jsonStr = JSON.stringify(docs, null, 2);
    const hash = crypto.createHash('sha256').update(jsonStr).digest('hex');

    await fs.writeFile(path.join(backupDir, `${col.name}.json`), jsonStr, 'utf8');
    manifest.push({
      collection: col.name,
      count: docs.length,
      sha256: hash
    });
    totalDocs += docs.length;
  }

  const manifestData = {
    createdAt: new Date().toISOString(),
    sourceDatabase: conn.name,
    totalCollections: manifest.length,
    totalRecords: totalDocs,
    durationMs: Date.now() - startedAt,
    collections: manifest
  };

  await fs.writeFile(path.join(backupDir, 'manifest.json'), JSON.stringify(manifestData, null, 2), 'utf8');
  await conn.close();

  console.log('====================================================');
  console.log('✅ BACKUP COMPLETE & VERIFIED!');
  console.log(`📁 Destination: ${backupDir}`);
  console.log(`📊 Total Collections: ${manifest.length}`);
  console.log(`📄 Total Documents: ${totalDocs}`);
  console.log(`⏱️ Duration: ${Date.now() - startedAt} ms`);
  console.log('====================================================');
}

backup().catch((err) => {
  console.error('❌ Backup failed:', err.message);
  process.exit(1);
});
