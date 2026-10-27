import mongoose from 'mongoose';

export default mongoose.model(
  'Notification',
  new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
      message: { type: String, required: true },
      readAt: Date,
    },
    { timestamps: true }
  )
);
