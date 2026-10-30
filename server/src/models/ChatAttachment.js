import mongoose from 'mongoose';

const s = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file: { type: String, required: true }, // stored filename in UPLOAD_DIR
    url: { type: String, required: true }, // /uploads/<file>
    originalName: String,
    mimeType: { type: String, enum: ['image/jpeg', 'image/png'], required: true },
    size: Number,
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

s.index({ user: 1, used: 1, createdAt: 1 });

export default mongoose.model('ChatAttachment', s);
