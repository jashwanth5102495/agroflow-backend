import app from './app';
import { webcrypto } from 'node:crypto';
import { env } from './config/env';
import { connectDB } from './config/database';
import { initNotificationScheduler } from './services/scheduler.service';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto;
}

const startServer = async () => {
  const port = Number(env.PORT) || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${port} in ${env.NODE_ENV} mode`);
  });

  await connectDB();

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
