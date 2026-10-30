import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedIfEmpty } from './src/seed/seed.js';

let initialized = false;

app.use(async (_req, _res, next) => {
  if (!initialized) {
    try {
      await connectDB();
      await seedIfEmpty();
      initialized = true;
    } catch (err) {
      console.error('Database connection error:', err.message);
    }
  }
  next();
});

export default app;
