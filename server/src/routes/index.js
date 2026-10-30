import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadImages } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as reports from '../controllers/reportController.js';
import * as map from '../controllers/mapController.js';
import adminRoutes from './admin.js';
import { listBuildings } from '../controllers/buildingController.js';
import { listNotifications, markAllRead } from '../controllers/notificationController.js';
import { updateMe } from '../controllers/userController.js';
import chatRoutes from './chat.js';
import {
  registerSchema,
  loginSchema,
  googleSchema,
  updateProfileSchema,
} from '../validators/authSchemas.js';
import {
  createReportSchema,
  listReportsQuery,
  mapQuery,
  updateStatusSchema,
} from '../validators/reportSchemas.js';

const r = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth
r.post('/auth/register', authLimiter, validate(registerSchema), auth.register);
r.post('/auth/login', authLimiter, validate(loginSchema), auth.login);
r.post('/auth/google', authLimiter, validate(googleSchema), auth.googleLogin);
r.post('/auth/logout', auth.logout);
r.get('/auth/me', requireAuth, auth.me);
r.patch('/users/me', requireAuth, validate(updateProfileSchema), updateMe);

// Reports (order matters: /stats before /:reportId)
r.post('/reports', requireAuth, uploadImages, validate(createReportSchema), reports.createReport);
r.get('/reports', requireAuth, validate(listReportsQuery, 'query'), reports.listMyReports);
r.get('/reports/stats', requireAuth, reports.myStats);
r.get('/reports/:reportId', requireAuth, reports.getReport);
r.post('/reports/:reportId/feedback', requireAuth, reports.reportFeedback);

// Map, buildings, notifications, chat
r.get('/map/reports', requireAuth, validate(mapQuery, 'query'), map.mapReports);
r.get('/map/heat', requireAuth, validate(mapQuery, 'query'), map.heatPoints);
r.get('/buildings', requireAuth, listBuildings);
r.get('/notifications', requireAuth, listNotifications);
r.patch('/notifications/read-all', requireAuth, markAllRead);
r.use('/chat', chatRoutes);

// Admin routes
r.use('/admin', adminRoutes);

export default r;
