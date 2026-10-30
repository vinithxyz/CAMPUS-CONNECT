import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

export function formatMongoUri(rawUri) {
  if (!rawUri) return rawUri;
  try {
    const prefixMatch = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
    if (!prefixMatch) return rawUri;

    const prefix = prefixMatch[1];
    const rest = prefixMatch[2];

    const lastAtIndex = rest.lastIndexOf('@');
    if (lastAtIndex === -1) return rawUri;

    const creds = rest.substring(0, lastAtIndex);
    const hostAndRest = rest.substring(lastAtIndex + 1);

    const firstColonIndex = creds.indexOf(':');
    if (firstColonIndex === -1) return rawUri;

    const username = creds.substring(0, firstColonIndex);
    const password = creds.substring(firstColonIndex + 1);

    const decodedPassword = decodeURIComponent(password);
    const encodedPassword = encodeURIComponent(decodedPassword);

    return `${prefix}${encodeURIComponent(decodeURIComponent(username))}:${encodedPassword}@${hostAndRest}`;
  } catch {
    return rawUri;
  }
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  mongoose.set('strictQuery', true);
  const targetUri = formatMongoUri(env.MONGO_URI);
  try {
    await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB successfully`);
  } catch (err) {
    if (process.env.VERCEL) {
      console.error(`MongoDB connection failed on Vercel: ${err.message}`);
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
