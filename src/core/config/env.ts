import { z } from 'zod';

/**
 * Zod schema for all required environment variables.
 * Validated once at startup — the app crashes immediately with a clear
 * message if any required variable is missing or wrong type.
 */
const envSchema = z.object({
  // ── App ──────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_PREFIX: z.string().default('/api/v1'),

  // ── Database ─────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // ── Auth ─────────────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // ── CORS ─────────────────────────────────────────────────────────────
  CORS_ORIGINS: z.string().optional(),

  // ── Logging ──────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('debug'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\n❌ Environment validation failed:\n${issues}\n`);
    process.exit(1);
  }

  return result.data;
}

// Singleton — parsed once, reused everywhere via import
export const env = loadEnv();

export const isDev = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';
export const isProd = () => env.NODE_ENV === 'production';
