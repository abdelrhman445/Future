import { PrismaClient } from '@prisma/client';
import { logger } from '../core/utils/logger';

const prisma = new PrismaClient({
  // Connection pool optimized for Supabase
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
    // Only log slow queries in dev (removed query logging to reduce noise)
    ...(process.env.NODE_ENV === 'development'
      ? [{ emit: 'event' as const, level: 'query' as const }]
      : []),
  ],
});

// Log slow queries only (threshold 1000ms for Supabase)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: { duration: number; query: string }) => {
    if (e.duration > 1000) {
      logger.warn('Slow query detected', { duration: e.duration, query: e.query.slice(0, 200) });
    }
  });
}

prisma.$on('error' as never, (e: unknown) => {
  logger.error('Prisma error', { error: e });
});

export default prisma;
