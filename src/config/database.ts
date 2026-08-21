import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  const tryConnect = async () => {
    try {
      if (!env.MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI is not set. Please set MONGODB_URI in Railway variables.');
        return;
      }
      const conn = await mongoose.connect(env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB Connection Error: ${(error as Error).message}. Retrying in 5s...`);
      setTimeout(tryConnect, 5000);
    }
  };

  await tryConnect();
};
