import mongoose from 'mongoose';

export default mongoose.model(
  'ReportComment',
  new mongoose.Schema(
    {
      report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, trim: true, maxlength: 500, default: '' },
      images: [{ url: String, filename: String, _id: false }],
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )
);
