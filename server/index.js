import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedIfEmpty } from './src/seed/seed.js';

let initialized = false;

app.use(async (_req, res, next) => {
  if (!initialized || mongoose.connection.readyState === 0) {
    try {
      await connectDB();
      if (!initialized) {
        await seedIfEmpty();
        initialized = true;
      }
    } catch (err) {
      console.error('Database connection error:', err.message);
      return res.status(503).json({
        error: {
          message: `Database connection failed (${err.message}). Check your MONGO_URI in Vercel settings.`,
        },
      });
    }
  }
  next();
});

export default app;
