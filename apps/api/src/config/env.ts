import crypto from 'node:crypto';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_ORIGIN: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/cas_erp_dev'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev_only_cas_erp_access_secret_change_in_prod'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_only_cas_erp_refresh_secret_change_in_prod'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  FIELD_ENCRYPTION_KEY: z.string().default('dev_only_32_byte_key_material_cas_erp_01'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_ROOT: z.string().default('./storage'),
  AWS_REGION: z.string().default('ap-south-1'),
  S3_BUCKET_NAME: z.string().default(''),
  CASHFREE_MODE: z.enum(['disabled', 'sandbox', 'production']).default('disabled'),
  CASHFREE_CLIENT_ID: z.string().default(''),
  CASHFREE_CLIENT_SECRET: z.string().default(''),
  CASHFREE_WEBHOOK_SECRET: z.string().default(''),
  CASHFREE_API_VERSION: z.string().default('2023-08-01'),
  EMAIL_PROVIDER: z.enum(['disabled', 'log', 'smtp']).default('disabled'),
  SMS_PROVIDER: z.enum(['disabled', 'log']).default('disabled'),
  WHATSAPP_PROVIDER: z.enum(['disabled', 'log']).default('disabled'),
  GOOGLE_SSO_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  MICROSOFT_SSO_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  BIOMETRIC_POLICY_APPROVED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  AI_ASSISTANT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  ML_SERVICE_URL: z.string().default('http://127.0.0.1:8001'),
  ML_SERVICE_TOKEN: z.string().default('dev_only_internal_ml_token')
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(): AppEnv {
  const parsed = envSchema.parse(process.env);
  if (parsed.NODE_ENV === 'production') {
    // In production, if dev secrets are still present, automatically replace with cryptographically secure 256-bit keys
    if (parsed.JWT_ACCESS_SECRET.startsWith('dev_only_')) {
      parsed.JWT_ACCESS_SECRET = crypto.randomBytes(32).toString('hex');
    }
    if (parsed.JWT_REFRESH_SECRET.startsWith('dev_only_')) {
      parsed.JWT_REFRESH_SECRET = crypto.randomBytes(32).toString('hex');
    }
    if (parsed.FIELD_ENCRYPTION_KEY.startsWith('dev_only_')) {
      parsed.FIELD_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex').slice(0, 32);
    }
  }
  return parsed;
}

export const env = loadEnv();

