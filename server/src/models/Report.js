import mongoose from 'mongoose';

export const CATEGORIES = [
  'electrical',
  'plumbing',
  'mechanical',
  'civil',
  'sanitation',
  'wifi',
  'hostel',
  'canteen',
  'safety',
  'other',
];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const STATUSES = ['pending', 'in_progress', 'resolved'];

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, maxlength: 500 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    priorityRank: { type: Number, index: true }, // low 1, medium 2, high 3, critical 4
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
    room: { type: String, required: true, trim: true, maxlength: 100 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    images: [{ url: String, filename: String, _id: false }],
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    history: [historySchema],
    resolvedAt: Date,
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const RANK = { low: 1, medium: 2, high: 3, critical: 4 };
reportSchema.pre('validate', function (next) {
  this.priorityRank = RANK[this.priority] ?? 2;
  next();
});

// Students must not receive assignee IDs. Admin controllers use .lean() and return it explicitly.
reportSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.assignedTo;
    return ret;
  },
});

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ reporter: 1, status: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: 1 }); // overdue and stats queries

export default mongoose.model('Report', reportSchema);
