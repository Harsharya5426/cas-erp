import pino from 'pino';
import { pinoHttp } from 'pino-http';
import type { Request } from 'express';

const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.mfaSecret',
      '*.token',
      '*.refreshToken',
      '*.clientSecret',
      '*.webhookSecret',
      '*.biometricTemplate'
    ],
    censor: '[REDACTED]'
  }
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: Request) => (req as Request & { requestId?: string }).requestId || 'unknown',
  autoLogging: !isTest
});

