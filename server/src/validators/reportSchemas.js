import { z } from 'zod';
import { CATEGORIES, PRIORITIES, STATUSES } from '../models/Report.js';

export const createReportSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(2000),
  building: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid building'),
  room: z.string().trim().min(1).max(100),
  priority: z.enum(PRIORITIES).default('medium'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const listReportsQuery = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['createdAt', '-createdAt', 'priority', '-priority', 'title']).default('-createdAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const mapQuery = z.object({
  categories: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter((c) => CATEGORIES.includes(c)) : [])),
  includeResolved: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(500).optional(),
});
