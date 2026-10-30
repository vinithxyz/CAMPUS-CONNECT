import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/adminSchemas.js';
import * as rep from '../controllers/admin/reportsController.js';
import { adminStats } from '../controllers/admin/statsController.js';
import { adminMapReports, adminHeat } from '../controllers/admin/mapController.js';
import { listUsers, updateUser } from '../controllers/admin/usersController.js';
import * as bld from '../controllers/admin/buildingsController.js';
import { listAudit } from '../controllers/admin/auditController.js';

const r = Router();
const adminOnly = requireRole('admin');
const idParam = validate(s.reportIdParams, 'params');

r.use(requireAuth, requireRole('admin', 'staff'));

r.get('/stats', validate(s.statsQuery, 'query'), adminStats);

// Reports. Fixed paths BEFORE /:reportId
r.get('/reports', validate(s.adminReportsQuery, 'query'), rep.listReports);
r.get('/reports/export', adminOnly, validate(s.adminReportsQuery, 'query'), rep.exportCsv);
r.post('/reports/bulk-status', adminOnly, validate(s.bulkBody), rep.bulkStatus);
r.get('/reports/:reportId', idParam, rep.getReportDetail);
r.patch('/reports/:reportId/status', idParam, validate(s.statusBody), rep.changeStatus);
r.patch('/reports/:reportId/assign', adminOnly, idParam, validate(s.assignBody), rep.assignReport);
r.post('/reports/:reportId/notes', idParam, validate(s.noteBody), rep.addNote);
r.get('/staff', adminOnly, rep.listAssignable);

// Map
r.get('/map/reports', validate(s.adminMapQuery, 'query'), adminMapReports);
r.get('/map/heat', validate(s.adminMapQuery, 'query'), adminHeat);

// Admin-only management
r.get('/users', adminOnly, validate(s.usersQuery, 'query'), listUsers);
r.patch('/users/:id', adminOnly, validate(s.updateUserBody), updateUser);
r.post('/buildings', adminOnly, validate(s.buildingBody), bld.createBuilding);
r.patch('/buildings/:id', adminOnly, validate(s.buildingPatch), bld.updateBuilding);
r.delete('/buildings/:id', adminOnly, bld.deleteBuilding);
r.get('/audit', adminOnly, validate(s.auditQuery, 'query'), listAudit);

export default r;
