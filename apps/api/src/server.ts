import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './core/logger.js';
import { ensureBaselineSeed } from './scripts/seed.js';

async function bootstrap() {
  if (
    env.NODE_ENV === 'production' &&
    (env.MONGODB_URI.includes('127.0.0.1') || env.MONGODB_URI.includes('localhost'))
  ) {
    logger.warn(
      'MONGODB_URI is pointing to localhost in production. Please set MONGODB_URI in your Render Environment Variables to your MongoDB Atlas connection string (e.g. mongodb+srv://...).'
    );
  }

  try {
    await connectDatabase(env.MONGODB_URI);
    await ensureBaselineSeed();
  } catch (err: any) {
    logger.error(
      { err: err?.message || err },
      'Failed to connect to MongoDB database. Please verify MONGODB_URI in your hosting environment variables.'
    );
    throw err;
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'CAS ERP API server listening');
  });

  const shutdown = async () => {
    logger.info('Shutting down CAS ERP API server');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error starting API server');
  process.exit(1);
});

