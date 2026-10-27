import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { seedIfEmpty } from './seed/seed.js';

await connectDB();
await seedIfEmpty();

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});
