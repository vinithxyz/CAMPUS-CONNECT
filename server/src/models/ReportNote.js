import mongoose from 'mongoose';

export default mongoose.model(
  'ReportNote',
  new mongoose.Schema(
    {
      report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true, trim: true, maxlength: 1000 },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )
);
