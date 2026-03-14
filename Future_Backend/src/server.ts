import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { config } from './config';
import { logger } from './core/utils/logger';
import { setupSecurity } from './core/security';
import { sanitizeInput, requestId, globalErrorHandler, notFoundHandler } from './core/middlewares';
import inspectorRouter from './modules/inspector/inspector.router';
import packagesRouter from './modules/packages/packages.router';

// Module Routers
import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import coursesRouter from './modules/courses/courses.router';
import affiliateRouter from './modules/affiliate/affiliate.router';
import presentationsRouter from './modules/presentations/presentations.router';
import mediaRouter from './modules/media/media.router';
import paymentsRouter from './modules/payments/payments.router';
import managerRouter from './modules/manager/manager.router';

import prisma from './config/prisma';

// ==================== CREATE APP ====================
const app = express();

// ==================== SECURITY MIDDLEWARE ====================
setupSecurity(app);

// ==================== BODY PARSING ====================
// ⚠️ Raw body للـ Stripe Webhook لازم يكون قبل express.json()
app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(config.cookie.secret));

// ==================== LOGGING ====================
if (config.server.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}
app.use('/api/manager', managerRouter);
// ==================== CUSTOM MIDDLEWARE ====================
app.use(requestId);
app.use(sanitizeInput);

// ==================== HEALTH CHECK ====================
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ==================== API ROUTES ====================
const API_PREFIX = '/api';

app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/courses`, coursesRouter);
app.use(`${API_PREFIX}/affiliate`, affiliateRouter);
app.use(`${API_PREFIX}/presentations`, presentationsRouter);
app.use(`${API_PREFIX}/media`, mediaRouter);
app.use(`${API_PREFIX}/payments`, paymentsRouter);
app.use('/api/inspector', inspectorRouter);
app.use('/api/packages', packagesRouter);
// ==================== 404 & ERROR HANDLERS ====================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ==================== GRACEFUL SHUTDOWN ====================
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// ==================== START SERVER ====================
async function bootstrap(): Promise<void> {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.server.port}`);
      logger.info(`📚 Environment: ${config.server.nodeEnv}`);
      logger.info(`🔒 Security: Helmet + CORS + Rate Limiting active`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${config.server.port} is already in use`);
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

bootstrap();

export default app;
