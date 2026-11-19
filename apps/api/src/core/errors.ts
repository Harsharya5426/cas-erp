import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES } from '@cas-erp/shared';
import { logger } from './logger.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as Request & { requestId?: string }).requestId || 'unknown';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      requestId,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {})
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      requestId,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Request validation failed',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }
    });
    return;
  }

  // Mongoose duplicate key error
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    res.status(409).json({
      success: false,
      requestId,
      error: {
        code: ERROR_CODES.CONFLICT,
        message: 'A record with this unique identifier already exists',
        details: keyValue ? Object.keys(keyValue) : undefined
      }
    });
    return;
  }

  logger.error({ err, requestId, path: req.originalUrl }, 'Unhandled API error');
  res.status(500).json({
    success: false,
    requestId,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected server error occurred'
    }
  });
}
