import mongoose from 'mongoose';

const s = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    type: { type: String, required: true }, // report.create, report.comment, report.reopen, report.cancel, report.support, report.status, report.assign
    payload: { type: mongoose.Schema.Types.Mixed, required: true }, // validated server-side, never trusted from the client
    summary: { type: mongoose.Schema.Types.Mixed, required: true }, // what the card displays
    status: {
      type: String,
      enum: ['pending', 'processing', 'confirmed', 'cancelled', 'expired', 'failed'],
      default: 'pending',
    },
    expiresAt: { type: Date, required: true },
    result: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

s.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 }); // delete a day after expiry

export default mongoose.model('PendingAction', s);
