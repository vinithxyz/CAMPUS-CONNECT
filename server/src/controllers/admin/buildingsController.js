import Building from '../../models/Building.js';
import Report from '../../models/Report.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { audit } from '../../utils/audit.js';

const toDoc = ({ name, code, lat, lng }) => ({
  ...(name && { name }),
  ...(code && { code }),
  ...(lat !== undefined && lng !== undefined && { location: { type: 'Point', coordinates: [lng, lat] } }),
  isSample: false, // admin-entered coordinates are real
});

export const createBuilding = asyncHandler(async (req, res) => {
  const b = await Building.create(toDoc(req.body));
  await audit(req, 'building.create', 'building', b.id, req.body);
  res.status(201).json({ data: b });
});

export const updateBuilding = asyncHandler(async (req, res) => {
  if ((req.body.lat === undefined) !== (req.body.lng === undefined)) {
    throw new ApiError(400, 'Provide both lat and lng');
  }
  const b = await Building.findByIdAndUpdate(req.params.id, toDoc(req.body), { new: true, runValidators: true });
  if (!b) throw new ApiError(404, 'Building not found');
  await audit(req, 'building.update', 'building', b.id, req.body);
  res.json({ data: b });
});

export const deleteBuilding = asyncHandler(async (req, res) => {
  if (await Report.exists({ building: req.params.id })) {
    throw new ApiError(409, 'This building has reports and cannot be deleted');
  }
  const b = await Building.findByIdAndDelete(req.params.id);
  if (!b) throw new ApiError(404, 'Building not found');
  await audit(req, 'building.delete', 'building', req.params.id, { name: b.name });
  res.status(204).end();
});
