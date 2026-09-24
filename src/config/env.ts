import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MongoDB connection URI is required'),
  JWT_SECRET: z.string().default('agroflow_jwt_secret_production_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('*'),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  ENABLE_TELEGRAM: z.string().default('true'),
});

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGODB_URL;

const envParsed = envSchema.safeParse({
  ...process.env,
  MONGODB_URI: mongoUri,
  JWT_SECRET: process.env.JWT_SECRET || 'agroflow_jwt_secret_production_key_2026',
  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_ORIGIN ||
    process.env.CORS_ORIGIN ||
    process.env.CORS_ORIGINS ||
    '*',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  ENABLE_TELEGRAM: process.env.ENABLE_TELEGRAM || 'true',
});

if (!envParsed.success) {
  console.error('❌ Invalid environment variables:', envParsed.error.format());
  process.exit(1);
}

export const env = {
  ...envParsed.data,
  IS_TELEGRAM_ENABLED: envParsed.data.ENABLE_TELEGRAM !== 'false',
};
