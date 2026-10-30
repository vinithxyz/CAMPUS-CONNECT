import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 2500 });
    console.log(`Connected to MongoDB at ${env.MONGO_URI}`);
  } catch (err) {
    if (process.env.VERCEL) {
      console.error(
        `MongoDB connection failed on Vercel: ${err.message}. Please configure MONGO_URI in your Vercel Project Environment Variables.`
      );
      throw err;
    }
    console.warn(`Local MongoDB not reached (${err.message}). Starting embedded MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri);
      console.log(`Connected to in-memory MongoDB at ${memUri}`);
    } catch (memErr) {
      console.error('Failed to start in-memory MongoDB:', memErr);
      throw memErr;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}
