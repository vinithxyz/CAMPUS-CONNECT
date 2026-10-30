import mongoose from 'mongoose';

const s = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true, maxlength: 300 },
    images: [{ url: String, filename: String, _id: false }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

s.index({ report: 1, user: 1 }, { unique: true }); // one support per student per report

export default mongoose.model('ReportSupport', s);
