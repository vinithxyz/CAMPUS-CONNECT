import 'dotenv/config';
import { z } from 'zod';

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
});

export const env = schema.parse(process.env);
