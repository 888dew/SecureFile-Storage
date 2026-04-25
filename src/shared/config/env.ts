import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_SSL: z.coerce.boolean().default(false),
  DB_POOL_SIZE: z.coerce.number().default(10),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TTL_SECONDS: z.coerce.number().default(3600),

  // Storage (S3-compatible)
  STORAGE_PROVIDER: z.enum(['s3', 'local']).default('local'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),

  // File upload limits
  MAX_FILE_SIZE_MB: z.coerce.number().default(100),
  ALLOWED_MIME_TYPES: z
    .string()
    .default(
      'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/zip,application/x-zip-compressed',
    ),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  UPLOAD_RATE_LIMIT_MAX: z.coerce.number().default(20),

  // Share / Temp URLs
  SHARE_TOKEN_EXPIRES_IN_HOURS: z.coerce.number().default(24),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Virus scan (ClamAV or mock)
  VIRUS_SCAN_ENABLED: z.coerce.boolean().default(false),
  CLAMAV_HOST: z.string().default('localhost'),
  CLAMAV_PORT: z.coerce.number().default(3310),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const missingKeys = Object.entries(formatted)
      .filter(([key, value]) => key !== '_errors' && value !== undefined)
      .map(([key]) => key)
      .join(', ');

    throw new Error(`❌ Invalid environment variables: ${missingKeys}\n${result.error.message}`);
  }

  return result.data;
}

export const env: Env = validateEnv();

export type { Env };
