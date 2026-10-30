import mongoose from 'mongoose';

const s = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    category: {
      type: String,
      enum: ['hostel', 'canteen', 'wifi', 'contacts', 'emergency', 'reporting', 'general'],
      default: 'general',
    },
    tags: [String],
    published: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

s.index({ title: 'text', body: 'text', tags: 'text' }, { weights: { title: 5, tags: 3, body: 1 } });

export default mongoose.model('KnowledgeArticle', s);
