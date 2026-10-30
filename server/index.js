import app from './src/app.js';
import { connectDB } from './src/config/db.js';

// Pre-connect in the background
connectDB().catch((err) => console.error('Initial DB connection error:', err.message));

export default app;
