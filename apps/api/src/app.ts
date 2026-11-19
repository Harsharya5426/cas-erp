import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ERROR_CODES } from '@cas-erp/shared';
import { isDatabaseReady } from './config/db.js';
import { env } from './config/env.js';
import { AppError, errorMiddleware } from './core/errors.js';
import { httpLogger } from './core/logger.js';
import { requestIdMiddleware, sendSuccess } from './core/requestContext.js';
import { academicsRouter } from './modules/academics/routes.js';
import { admissionsRouter, publicRouter } from './modules/admissions/routes.js';
import { attendanceRouter } from './modules/attendance/routes.js';
import { campusRouter } from './modules/campus/routes.js';
import { examsRouter } from './modules/exams/routes.js';
import { financeRouter, webhooksRouter } from './modules/finance/routes.js';
import { hrRouter } from './modules/hr/routes.js';
import { authRouter, rbacRouter } from './modules/identity/routes.js';
import { notificationsRouter } from './modules/notifications/routes.js';
import { orgRouter } from './modules/org/routes.js';
import { reportsRouter } from './modules/reports/routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(httpLogger);
  app.use(helmet());

  app.use(
    cors({
      origin: (_origin, callback) => {
        // Automatically allow requesting origin (Vercel, Render, local dev, custom domain) with credentials
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'Accept', 'Origin']
    })
  );

  app.use(cookieParser());
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: string }).rawBody = buf.toString('utf8');
      }
    })
  );

  if (env.NODE_ENV !== 'test') {
    app.use(
      ['/api/v1/auth/login', '/auth/login'],
      rateLimit({ windowMs: 15 * 60_000, max: 30, standardHeaders: true, legacyHeaders: false })
    );
    app.use(
      ['/api/v1', '/'],
      rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false })
    );
  }

  // Root API Service Index
  app.get('/', (req: Request, res: Response) => {
    sendSuccess(req, res, {
      service: 'cas-erp-api',
      version: '2.0.0',
      webPortalUrl: 'http://localhost:5173/login',
      endpoints: {
        health: '/api/v1/healthz',
        ready: '/api/v1/readyz',
        openapi: '/api/v1/openapi.json'
      }
    });
  });

  // Health & Readiness Probes
  app.get('/api/v1/healthz', (req: Request, res: Response) => {
    sendSuccess(req, res, {
      status: 'ok',
      service: 'cas-erp-api',
      timestampUTC: new Date().toISOString()
    });
  });

  app.get('/api/v1/readyz', (req: Request, res: Response) => {
    const dbReady = isDatabaseReady();
    if (!dbReady) {
      res.status(503).json({
        success: false,
        error: { code: 'NOT_READY', message: 'Database connection not ready' }
      });
      return;
    }
    sendSuccess(req, res, { status: 'ready', mongodb: 'connected' });
  });

  app.get('/api/v1/openapi.json', (_req, res) => {
    res.json({
      openapi: '3.1.0',
      info: {
        title: 'Centre for Advanced Studies ERP API',
        version: '2.0.0',
        description: 'Versioned REST API for CAS AKTU Lucknow Educational ERP'
      },
      servers: [{ url: '/api/v1' }],
      paths: {
        '/healthz': { get: { summary: 'Liveness probe' } },
        '/readyz': { get: { summary: 'Readiness probe (MongoDB)' } },
        '/auth/login': { post: { summary: 'Authenticate user and issue session cookies + JWT' } },
        '/auth/me': { get: { summary: 'Fetch authenticated context and role permissions' } },
        '/rbac/roles': { get: { summary: 'List 12+ configurable RBAC role templates' } },
        '/public/admissions/apply': { post: { summary: 'Submit public admission application' } },
        '/academics/students': { get: { summary: 'Scoped student directory' } },
        '/attendance/lectures/mark': { post: { summary: 'Mark lecture attendance (Manual/QR/RFID)' } },
        '/finance/payments/offline': { post: { summary: 'Record verified offline fee receipt & double-entry ledger' } },
        '/webhooks/cashfree': { post: { summary: 'Idempotent HMAC-verified Cashfree webhook handler' } },
        '/exams/schedules/{id}/publish': { post: { summary: 'Audit-locked SGPA/CGPA result publication' } },
        '/campus/grievances': { get: { summary: 'Confidentiality-isolated grievance helpdesk' } },
        '/reports/summary': { get: { summary: 'Role-scoped executive KPIs' } }
      }
    });
  });

  // Mount Domain Routers (on both /api/v1 and root fallback for client resilience)
  const mountDomainRouters = (prefix: string) => {
    app.use(`${prefix}/public`, publicRouter);
    app.use(`${prefix}/webhooks`, webhooksRouter);
    app.use(`${prefix}/auth`, authRouter);
    app.use(`${prefix}/rbac`, rbacRouter);
    app.use(`${prefix}/org`, orgRouter);
    app.use(`${prefix}/notifications`, notificationsRouter);
    app.use(`${prefix}/academics`, academicsRouter);
    app.use(`${prefix}/admissions`, admissionsRouter);
    app.use(`${prefix}/attendance`, attendanceRouter);
    app.use(`${prefix}/hr`, hrRouter);
    app.use(`${prefix}/finance`, financeRouter);
    app.use(`${prefix}/exams`, examsRouter);
    app.use(`${prefix}/campus`, campusRouter);
    app.use(`${prefix}/reports`, reportsRouter);
  };

  mountDomainRouters('/api/v1');
  mountDomainRouters('');

  app.use((req, _res, next) => {
    next(new AppError(404, ERROR_CODES.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
  });

  app.use(errorMiddleware);
  return app;
}

