import { z } from 'zod';
import { CATEGORIES, PRIORITIES, STATUSES } from '../models/Report.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
const boolStr = z.enum(['true', 'false']).transform((v) => v === 'true');
const reportIdParam = z.string().regex(/^CP\d{4,}$/i);

export const adminReportsQuery = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  building: objectId.optional(),
  assignedTo: z.union([objectId, z.literal('unassigned')]).optional(),
  overdue: boolStr.optional(),
  search: z.string().trim().max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z
    .enum(['createdAt', '-createdAt', 'priority', '-priority', 'status', '-status', 'title', '-title'])
    .default('-createdAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const statsQuery = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export const statusBody = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const assignBody = z.object({
  assigneeId: objectId.nullable(),
});

export const noteBody = z.object({
  text: z.string().trim().min(1).max(1000),
});

export const bulkBody = z.object({
  reportIds: z.array(reportIdParam).min(1).max(50),
  status: z.enum(STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const reportIdParams = z.object({
  reportId: reportIdParam,
});

export const adminMapQuery = z.object({
  categories: z.string().optional().transform((v) => (v ? v.split(',').filter((c) => CATEGORIES.includes(c)) : [])),
  statuses: z.string().optional().transform((v) => (v ? v.split(',').filter((s) => STATUSES.includes(s)) : [])),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const usersQuery = z.object({
  role: z.enum(['student', 'staff', 'admin']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserBody = z
  .object({
    role: z.enum(['student', 'staff', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, 'Provide role or isActive');

export const buildingBody = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,10}$/, '2 to 10 letters, numbers or dashes'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const buildingPatch = buildingBody.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const auditQuery = z.object({
  actor: objectId.optional(),
  action: z.string().max(50).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const knowledgeCategories = [
  'hostel',
  'canteen',
  'wifi',
  'contacts',
  'emergency',
  'reporting',
  'general',
];

export const knowledgeBody = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(3000),
  category: z.enum(knowledgeCategories).default('general'),
  tags: z.array(z.string().trim().max(30)).max(10).default([]),
  published: z.boolean().default(false),
});

export const knowledgePatch = knowledgeBody.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');

