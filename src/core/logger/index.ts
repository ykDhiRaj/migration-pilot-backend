import { createLogger, format, transports } from 'winston';
import { env, isProd } from '@core/config';

const { combine, timestamp, colorize, errors, printf, json } = format;

/**
 * Human-readable format for local development.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${ts} ${level}: ${stack ?? message}${metaStr}`;
  }),
);

/**
 * JSON format for production log aggregators (Datadog, Loki, CloudWatch …).
 */
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: isProd() ? prodFormat : devFormat,
  transports: [new transports.Console()],
  // Prevent Winston from swallowing unhandled exceptions — we handle those
  // ourselves in main.ts.
  exitOnError: false,
});

/**
 * Convenience: create a child logger with a module label.
 * Usage: `const log = childLogger('auth');`
 */
export const childLogger = (module: string) => logger.child({ module });
