import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../../config';

// ==================== CORS ====================
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman in dev)
    if (!origin && config.server.isDev) return callback(null, true);
    if (!origin) return callback(new Error('No origin'), false);
    if (config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    }
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours preflight cache
};

// ==================== HELMET ====================
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // may block media in dev
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ==================== RATE LIMITERS ====================

// Global rate limiter
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) + ' minutes',
  },
  skip: (req) => config.server.isDev && req.ip === '127.0.0.1' ? false : false,
});

// Auth routes (login/register) - very strict
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Account temporarily locked for 15 minutes.',
  },
  keyGenerator: (req) => req.body?.email || req.ip || 'unknown',
});

// OTP routes - very strict
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.otpMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP attempts. Please wait before requesting a new code.',
  },
  keyGenerator: (req) => req.body?.email || req.ip || 'unknown',
});

// Media signed URL generation
export const mediaRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many media requests.',
  },
});

// ==================== SECURITY MIDDLEWARE SETUP ====================
export function setupSecurity(app: Express): void {
  // Trust proxy (important for rate limiting behind reverse proxy like Nginx)
  app.set('trust proxy', 1);

  // Helmet (security headers)
  app.use(helmetConfig);

  // CORS
  app.use(cors(corsOptions));

  // Global rate limiting
  app.use(globalRateLimiter);
}
