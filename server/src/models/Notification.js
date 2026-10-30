import mongoose from 'mongoose';

export default mongoose.model(
  'Notification',
  new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' }, // optional now
      type: { type: String, enum: ['status', 'followup', 'cluster'], default: 'status' },
      message: { type: String, required: true },
      link: String, // in-app path to open on click
      meta: mongoose.Schema.Types.Mixed,
      readAt: Date,
    },
    { timestamps: true }
  )
);
