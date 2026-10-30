import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/campusconnect'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  ANTHROPIC_API_KEY: z.string().default(''),
  CHAT_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  OVERDUE_HOURS: z.coerce.number().int().min(1).default(48),
  CHAT_DAILY_LIMIT_USER: z.coerce.number().int().default(60),
  CHAT_DAILY_LIMIT_ADMIN: z.coerce.number().int().default(200),
  FOLLOWUP_HOURS: z.coerce.number().int().min(1).default(24),
  CLUSTER_WINDOW_HOURS: z.coerce.number().int().min(1).default(72),
  CLUSTER_MIN: z.coerce.number().int().min(2).default(3),
  REOPEN_WINDOW_DAYS: z.coerce.number().int().min(1).default(14),
  MAX_REOPENS: z.coerce.number().int().min(0).default(2),
  ENABLE_JOBS: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
});

export const env = schema.parse(process.env);
