import Building from '../models/Building.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listBuildings = asyncHandler(async (_req, res) => {
  const b = await Building.find().sort('name').lean();
  res.json({
    data: b.map((x) => ({
      id: x._id,
      name: x.name,
      code: x.code,
      lat: x.location.coordinates[1],
      lng: x.location.coordinates[0],
      isSample: x.isSample,
    })),
  });
});
