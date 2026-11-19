import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export interface RequestWithContext extends Request {
  requestId: string;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const requestId = incoming && incoming.length <= 64 ? incoming : crypto.randomUUID();
  (req as RequestWithContext).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.query = schema.parse(req.query);
    next();
  };
}

export function sendSuccess<T>(
  req: Request,
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): void {
  const requestId = (req as RequestWithContext).requestId || 'unknown';
  res.status(statusCode).json({
    success: true,
    requestId,
    data,
    ...(meta ? { meta } : {})
  });
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

