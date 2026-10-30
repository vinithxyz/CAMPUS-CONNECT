import mongoose from 'mongoose';

export default mongoose.model(
  'ClusterAlert',
  new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // `${buildingId}:${category}`
    lastCount: Number,
    lastAlertedAt: Date,
  })
);
