import mongoose from 'mongoose';

const s = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    day: { type: String, required: true }, // YYYY-MM-DD (UTC)
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

s.index({ user: 1, day: 1 }, { unique: true });
s.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export default mongoose.model('ChatUsage', s);
