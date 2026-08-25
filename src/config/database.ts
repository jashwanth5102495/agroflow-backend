import mongoose from 'mongoose';
import { env } from './env';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async () => {
  if (!env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not set. Please set MONGODB_URI in Railway variables.');
    return;
  }

  while (true) {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      const err = error as Error;
      console.error(`❌ MongoDB Connection Error: ${err.message}. Retrying in 5s...`);
      if (err.stack) {
        console.error(err.stack);
      }
      await wait(5000);
    }
  }
};
