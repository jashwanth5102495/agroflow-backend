import app from './app';
import { webcrypto } from 'node:crypto';
import { env } from './config/env';
import { connectDB } from './config/database';
import { initNotificationScheduler } from './services/scheduler.service';
import { initWhatsAppClient } from './services/whatsapp.service';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto;
}

const startServer = async () => {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  await connectDB();

  initWhatsAppClient();
  initNotificationScheduler();
};

startServer();

// Handle Unhandled Rejections and Exceptions
process.on('unhandledRejection', (err: any) => {
  console.error('❌ Unhandled Rejection:', err.message || err);
  process.exit(1);
});

process.on('uncaughtException', (err: any) => {
  console.error('❌ Uncaught Exception:', err.message || err);
  process.exit(1);
});
