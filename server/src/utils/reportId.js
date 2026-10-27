import Counter from '../models/Counter.js';

export async function nextReportId() {
  const c = await Counter.findOneAndUpdate(
    { _id: 'report' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CP${String(c.seq).padStart(4, '0')}`;
}
