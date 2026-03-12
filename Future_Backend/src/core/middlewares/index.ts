import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import xss from 'xss';
import { logger } from '../utils/logger';

// ==================== INPUT SANITIZATION ====================
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = xss(val.trim());
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        sanitized[key] = sanitize(val as Record<string, unknown>);
      } else if (Array.isArray(val)) {
        sanitized[key] = val.map((item) =>
          typeof item === 'string' ? xss(item.trim()) : item
        );
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  };

if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    req.body = sanitize(req.body);
  }
  next();
}

// ==================== REQUEST ID MIDDLEWARE ====================
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  res.setHeader('X-Request-ID', id as string);
  (req as Request & { requestId: string }).requestId = id as string;
  next();
}

// ==================== ERROR CLASSES ====================
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(422, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

// ==================== GLOBAL ERROR HANDLER ====================
export const globalErrorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Resource already exists' });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  // Handle AppError (operational)
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unexpected error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

// ==================== 404 HANDLER ====================
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}

// Success response helper
export function sendSuccess(
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
): void {
  res.status(statusCode).json({ success: true, message, data });
}
