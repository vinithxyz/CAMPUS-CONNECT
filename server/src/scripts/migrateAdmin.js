import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';
import ReportNote from '../models/ReportNote.js';

await connectDB();

await User.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });

const RANK = { low: 1, medium: 2, high: 3, critical: 4 };
for (const [priority, rank] of Object.entries(RANK)) {
  await Report.updateMany({ priority, priorityRank: { $exists: false } }, { $set: { priorityRank: rank } });
}

if (process.env.ADMIN_EMAIL) {
  const r = await User.updateOne({ email: process.env.ADMIN_EMAIL.toLowerCase() }, { $set: { role: 'admin' } });
  console.log(r.matchedCount ? `Promoted ${process.env.ADMIN_EMAIL} to admin` : 'ADMIN_EMAIL not found');
}

await Promise.all([Report.syncIndexes(), AuditLog.syncIndexes(), ReportNote.syncIndexes()]);
console.log('Admin migration complete');
await mongoose.disconnect();
