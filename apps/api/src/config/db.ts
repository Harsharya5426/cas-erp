import mongoose from 'mongoose';
import { logger } from '../core/logger.js';

export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });
  logger.info({ dbName: conn.connection.name }, 'Connected to MongoDB');
  return conn;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

