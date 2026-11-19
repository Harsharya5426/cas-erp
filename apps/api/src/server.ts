import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './core/logger.js';
import { ensureBaselineSeed } from './scripts/seed.js';

async function bootstrap() {
  await connectDatabase(env.MONGODB_URI);
  await ensureBaselineSeed();

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

