import winston from 'winston';
import { config } from '../../config';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: config.server.isDev ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: config.server.isDev
        ? combine(colorize(), simple())
        : combine(timestamp(), json()),
    }),
  ],
});
