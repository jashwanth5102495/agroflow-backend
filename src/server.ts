import app from './app';
import { env } from './config/env';
import { connectDB } from './config/database';
import { initNotificationScheduler } from './services/scheduler.service';
import { initWhatsAppClient } from './services/whatsapp.service';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Initialize WhatsApp Web Client (for QR device linking)
  initWhatsAppClient();

  // Initialize background notification cron job
  initNotificationScheduler();

  // Start the server
  app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
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
