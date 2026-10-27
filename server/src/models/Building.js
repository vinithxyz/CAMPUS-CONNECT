import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  isSample: { type: Boolean, default: true },
});

buildingSchema.index({ location: '2dsphere' });

export default mongoose.model('Building', buildingSchema);
