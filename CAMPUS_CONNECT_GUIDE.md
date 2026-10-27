# CampusConnect: Complete MERN Build Guide

**Campus Problem Reporting & Heat Map System** Stack: **MongoDB + Express + React (Vite, TypeScript) + Node.js** Design reference: `CampusConnect_Frontend_Pages_User123.pdf` (7 screens) Intended for: building with Antigravity (or any AI coding agent / by hand)

---

## Table of Contents

1. Project overview and scope
2. System architecture
3. Repository structure
4. Database design (MongoDB + Mongoose)
5. REST API specification
6. Backend implementation (Node + Express)
7. Frontend implementation (React + Vite + TS + Tailwind)
8. Page-by-page build notes (matching the PDF)
9. Authentication and security
10. Environment variables and setup commands
11. Seed data
12. Testing and QA checklist
13. Deployment
14. Antigravity workflow and prompts
15. Corrections to the PDF and known gaps
16. Build order checklist

---

## 1. Project overview and scope

### What it is

A web app where students report campus problems (leaking tap, broken fan, electrical fault), attach photos, pin the location on a map, and track progress. A heat map shows problem density across campus.

### Roles

| Role | Can do |
| --- | --- |
| **Student** | Register/login, report issues, view own complaints, view campus map and heat map, see status timeline, receive notifications |
| **Admin / Staff** | View all reports, change status with a note (creates timeline entry and notification). *Not shown in the PDF, but required so statuses can actually change.* |

### The 7 PDF screens

1. Landing 2. Login 3. Register 4. Dashboard 5. Report an Issue (3 steps) 6. Campus Map + Heat Map 7. My Complaints (+ status timeline)

Plus: Profile page, and a minimal Admin page (beyond the PDF).

### Principles

- Priority is **manual**. Do not label it "AI-detected" unless a real AI service is added.
- Dashboard numbers and charts are **computed from the database**, never hardcoded.
- Sample/seed coordinates are labelled as sample data.
- Frontend talks to the backend only through a `services/` layer.

---

## 2. System architecture

```
┌────────────────────────── Browser ──────────────────────────┐
│ React SPA (Vite, TS, Tailwind, React Router)                │
│  pages → hooks → services (axios) ─────────────┐            │
│  Leaflet + leaflet.heat, Recharts, RHF + Zod   │ HTTPS/JSON │
└────────────────────────────────────────────────┼────────────┘
                                                 ▼
┌──────────────────── Node.js + Express API ──────────────────┐
│ helmet · cors · rate-limit · cookie-parser · morgan         │
│ routes → validate(zod) → auth/role → controllers            │
│ multer (uploads) · jsonwebtoken · bcryptjs · google-auth    │
└───────────────┬─────────────────────────────┬───────────────┘
                ▼                             ▼
        MongoDB (Mongoose)          File storage (uploads/ locally,
        users, reports, buildings,   Cloudinary/S3 in production)
        counters, notifications
```

**Request flow example (submit report):** `ReportIssuePage` → `reportService.create(FormData)` → `POST /api/reports` → auth middleware → multer (≤5 files, ≤2 MB, jpg/png) → zod validation → generate `CP0013` → save Report with GeoJSON point and first history entry → `201` with report → UI shows confirmation + ID.

---

## 3. Repository structure

```
campusconnect/
├── README.md
├── client/                         # React + Vite + TypeScript
│   ├── public/images/              # campus-hero.jpg (your own photo)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Button, Input, Select, Textarea, Badge, Card, Table,
│   │   │   │                       # Modal, ConfirmDialog, Toast, Skeleton, EmptyState, Stepper
│   │   │   ├── layout/             # Navbar, Sidebar, Header, NotificationDropdown, ProfileMenu
│   │   │   ├── dashboard/          # StatCard, RecentComplaintsTable, QuickActions
│   │   │   ├── forms/              # FormField, PasswordInput, ImageUploader
│   │   │   ├── reports/            # StatusBadge, PriorityBadge, ReportDetailPanel, StatusTimeline
│   │   │   ├── map/                # CampusMap, HeatLayer, MarkerLayer, MapLegend,
│   │   │   │                       # CategoryFilter, LocationPicker, ViewToggle
│   │   │   └── charts/             # CategoryDoughnut
│   │   ├── pages/                  # Landing, Login, Register, Dashboard, ReportIssue,
│   │   │                           # CampusMap, MyComplaints, Profile, AdminReports, NotFound
│   │   ├── layouts/                # AuthLayout, DashboardLayout
│   │   ├── context/                # AuthContext, ToastContext
│   │   ├── hooks/                  # useAuth, useReports, useReportStats, useHeatLayer, useToast
│   │   ├── services/               # api.ts, authService.ts, reportService.ts, mapService.ts,
│   │   │                           # notificationService.ts, adminService.ts
│   │   ├── schemas/                # authSchemas.ts, reportSchemas.ts (Zod)
│   │   ├── types/                  # index.ts, leaflet-heat.d.ts
│   │   ├── utils/                  # format.ts, constants.ts, imageValidation.ts
│   │   ├── routes/                 # RequireAuth.tsx, RequireRole.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── vite.config.ts
│   └── package.json
└── server/                         # Node + Express + Mongoose
    ├── src/
    │   ├── config/                 # env.js, db.js
    │   ├── models/                 # User, Report, Building, Counter, Notification
    │   ├── controllers/            # auth, report, map, building, notification, admin, user
    │   ├── routes/                 # index.js + one file per resource
    │   ├── middleware/             # auth.js, requireRole.js, validate.js, upload.js, errorHandler.js
    │   ├── validators/             # authSchemas.js, reportSchemas.js
    │   ├── utils/                  # ApiError.js, asyncHandler.js, token.js, reportId.js
    │   ├── seed/seed.js
    │   ├── app.js
    │   └── server.js
    ├── uploads/                    # git-ignored
    ├── .env.example
    └── package.json
```

---

## 4. Database design (MongoDB + Mongoose)

### Collections

| Collection | Purpose |
| --- | --- |
| `users` | Students and admins |
| `reports` | Complaints, including GeoJSON location, images, status history |
| `buildings` | Campus buildings (dropdown + map labels) |
| `counters` | Atomic sequence for `CP0001`-style IDs |
| `notifications` | Per-user status-change notifications |

### Relationships

```
User 1 ──< Report >── 1 Building
User 1 ──< Notification >── 1 Report
Report embeds: images[], history[]   (always read together, so embedded)
```

### `server/src/models/User.js`

```js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    rollNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },          // absent for Google-only users
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = function (plain) {
  return this.passwordHash ? bcrypt.compare(plain, this.passwordHash) : false;
};
userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 12);

export default mongoose.model('User', userSchema);
```

### `server/src/models/Building.js`

```js
import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  isSample: { type: Boolean, default: true }, // flag demo coordinates
});
buildingSchema.index({ location: '2dsphere' });

export default mongoose.model('Building', buildingSchema);
```

### `server/src/models/Counter.js`

```js
import mongoose from 'mongoose';
export default mongoose.model(
  'Counter',
  new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } })
);
```

### `server/src/models/Report.js`

```js
import mongoose from 'mongoose';

export const CATEGORIES = [
  'electrical', 'plumbing', 'mechanical', 'civil', 'sanitation',
  'wifi', 'hostel', 'canteen', 'safety', 'other',
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
    reportId: { type: String, required: true, unique: true, index: true }, // CP0012
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
    room: { type: String, required: true, trim: true, maxlength: 100 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    images: [{ url: String, filename: String, _id: false }],
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    history: [historySchema],
    resolvedAt: Date,
    isSample: { type: Boolean, default: false }, // seeded demo data
  },
  { timestamps: true }
);

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ reporter: 1, status: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
```

### `server/src/models/Notification.js`

```js
import mongoose from 'mongoose';

export default mongoose.model(
  'Notification',
  new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
      message: { type: String, required: true },
      readAt: Date,
    },
    { timestamps: true }
  )
);
```

---

## 5. REST API specification

Base URL: `/api`. JSON in/out except report creation (`multipart/form-data`). Auth via httpOnly cookie `token` (Bearer header also accepted).

### Auth

| Method | Path | Auth | Body | Result |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | none | `name, rollNumber, email, password` | 201 user, sets cookie |
| POST | `/auth/login` | none | `identifier` (email or roll no.), `password`, `remember?` | 200 user, sets cookie |
| POST | `/auth/google` | none | `credential` (Google ID token) | 200 user, sets cookie |
| POST | `/auth/logout` | any | none | 204, clears cookie |
| GET | `/auth/me` | user | none | 200 current user |

### Users

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| PATCH | `/users/me` | user | update `name`, `rollNumber` |

### Reports (student)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/reports` | multipart: `category,title,description,building,room,priority,lat,lng` + `images` (0–5 files) |
| GET | `/reports` | own reports. Query: `status`, `category`, `search`, `sort` (`-createdAt` default), `page`, `limit` |
| GET | `/reports/stats` | own stats: `total, pending, inProgress, resolved, highPriority, byCategory[]` |
| GET | `/reports/:reportId` | own report incl. `history` (admin can read any) |

### Map

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/map/reports` | campus-wide, privacy-safe fields (no reporter). Query: `categories=electrical,plumbing`, `includeResolved=false` |
| GET | `/map/heat` | `[[lat,lng,intensity],...]` same query params |

### Buildings, notifications

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/buildings` | for dropdown and map labels |
| GET | `/notifications` | latest 20 + `unreadCount` |
| PATCH | `/notifications/read-all` | marks all read |

### Admin (`role=admin`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/reports` | all reports with filters |
| PATCH | `/admin/reports/:reportId/status` | body `{ status, note? }`, appends history, creates notification |

### Response shapes

```jsonc
// Success list
{ "data": [ ... ], "meta": { "page": 1, "limit": 10, "total": 12 } }
// Error
{ "error": { "message": "Validation failed", "details": [{ "path": "email", "message": "Invalid email" }] } }
```

### Category grouping for the map filter

UI filter labels (All, Electrical, Plumbing, Mechanical, Civil, Others) map to API values. **Others** = `sanitation, wifi, hostel, canteen, safety, other`. Do this mapping in `client/src/utils/constants.ts`.

### Heat intensity

Weight by priority: `low 0.25, medium 0.5, high 0.75, critical 1`. Exclude resolved by default.

---

## 6. Backend implementation (Node + Express)

### 6.1 Init

```bash
mkdir -p campusconnect/server && cd campusconnect/server
npm init -y
npm pkg set type=module
npm pkg set scripts.dev="node --watch src/server.js"
npm pkg set scripts.start="node src/server.js"
npm pkg set scripts.seed="node src/seed/seed.js"
npm pkg set scripts.test="vitest run"
npm i express mongoose dotenv zod cors helmet morgan cookie-parser express-rate-limit \
      jsonwebtoken bcryptjs multer google-auth-library
npm i -D vitest supertest mongodb-memory-server
```

Use **Express 4** (the default `express@4`). Pin it if your agent installs v5: `npm i express@4`.

### 6.2 `src/config/env.js`

```js
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads'),
});

export const env = schema.parse(process.env);
```

### 6.3 `src/config/db.js`

```js
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
  console.log('MongoDB connected');
}
```

### 6.4 Utilities

`src/utils/ApiError.js`

```js
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
```

`src/utils/asyncHandler.js`

```js
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

`src/utils/token.js`

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (user, remember = false) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: remember ? '30d' : '1d' });

export const setAuthCookie = (res, token, remember = false) =>
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: (remember ? 30 : 1) * 24 * 60 * 60 * 1000,
  });

export const clearAuthCookie = (res) =>
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
```

`src/utils/reportId.js`

```js
import Counter from '../models/Counter.js';

export async function nextReportId() {
  const c = await Counter.findOneAndUpdate(
    { _id: 'report' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CP${String(c.seq).padStart(4, '0')}`; // CP0001
}
```

### 6.5 Middleware

`src/middleware/auth.js`

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.token || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'You do not have permission'));
```

`src/middleware/validate.js`

```js
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(Object.assign(result.error, { isZod: true }));
  }
  req[source] = result.data;
  next();
};
```

> In Express 4, assigning `req.query = ...` works. If you upgrade to Express 5, store parsed query in `req.validatedQuery` instead.

`src/middleware/upload.js`

```js
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png' };

export const uploadImages = multer({
  storage: multer.diskStorage({
    destination: env.UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype] ?? path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new ApiError(400, 'Only JPG and PNG images are allowed')),
}).array('images', 5);
```

> Production hardening: also verify magic bytes (e.g. `file-type` package) and move files to Cloudinary/S3.

`src/middleware/errorHandler.js`

```js
import multer from 'multer';

export function notFound(_req, res) {
  res.status(404).json({ error: { message: 'Route not found' } });
}

export function errorHandler(err, _req, res, _next) {
  if (err.isZod) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 2 MB or smaller'
      : err.code === 'LIMIT_FILE_COUNT' ? 'You can upload up to 5 images' : err.message;
    return res.status(400).json({ error: { message: msg } });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return res.status(409).json({ error: { message: `That ${field} is already registered` } });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: { message: 'Invalid ID' } });

  const status = err.status ?? 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    error: { message: status === 500 ? 'Something went wrong' : err.message, details: err.details },
  });
}
```

### 6.6 Validators (`src/validators/`)

`authSchemas.js`

```js
import { z } from 'zod';

const password = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/\d/, 'Include a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  rollNumber: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9/_-]+$/, 'Letters, numbers, / _ - only'),
  email: z.string().trim().toLowerCase().email(),
  password,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or roll number'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
});

export const googleSchema = z.object({ credential: z.string().min(10) });
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  rollNumber: z.string().trim().min(3).max(30).optional(),
});
```

`reportSchemas.js`

```js
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
  categories: z.string().optional().transform((v) => (v ? v.split(',').filter((c) => CATEGORIES.includes(c)) : [])),
  includeResolved: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(500).optional(),
});
```

### 6.7 Controllers

`src/controllers/authController.js`

```js
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, rollNumber: u.rollNumber,
  role: u.role, avatarUrl: u.avatarUrl,
});

export const register = asyncHandler(async (req, res) => {
  const { name, rollNumber, email, password } = req.body;
  const user = await User.create({
    name, rollNumber, email, passwordHash: await User.hashPassword(password),
  });
  setAuthCookie(res, signToken(user));
  res.status(201).json({ data: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password, remember } = req.body;
  const isEmail = identifier.includes('@');
  const user = await User.findOne(
    isEmail ? { email: identifier.toLowerCase() } : { rollNumber: identifier.toUpperCase() }
  ).select('+passwordHash');

  // Same message for unknown user and wrong password (no account enumeration)
  if (!user || !(await user.verifyPassword(password))) {
    throw new ApiError(401, 'Incorrect email/roll number or password');
  }
  setAuthCookie(res, signToken(user, remember), remember);
  res.json({ data: publicUser(user) });
});

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleLogin = asyncHandler(async (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) throw new ApiError(501, 'Google login is not configured');
  const ticket = await googleClient.verifyIdToken({
    idToken: req.body.credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  if (!p?.email_verified) throw new ApiError(401, 'Google email is not verified');

  let user = await User.findOne({ $or: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] });
  if (!user) {
    user = await User.create({ name: p.name, email: p.email, googleId: p.sub, avatarUrl: p.picture });
  } else if (!user.googleId) {
    user.googleId = p.sub;
    await user.save();
  }
  setAuthCookie(res, signToken(user));
  res.json({ data: publicUser(user) });
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
};

export const me = (req, res) => res.json({ data: publicUser(req.user) });
```

`src/controllers/reportController.js`

```js
import Report from '../models/Report.js';
import Building from '../models/Building.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReportId } from '../utils/reportId.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createReport = asyncHandler(async (req, res) => {
  const b = req.body;
  const building = await Building.findById(b.building);
  if (!building) throw new ApiError(400, 'Selected building does not exist');

  const report = await Report.create({
    reportId: await nextReportId(),
    title: b.title, description: b.description, category: b.category,
    priority: b.priority, building: building._id, room: b.room,
    location: { type: 'Point', coordinates: [b.lng, b.lat] },
    images: (req.files ?? []).map((f) => ({ url: `/uploads/${f.filename}`, filename: f.originalname })),
    reporter: req.user._id,
    history: [{ status: 'pending', note: 'Report submitted', changedBy: req.user._id }],
  });
  res.status(201).json({ data: report });
});

export const listMyReports = asyncHandler(async (req, res) => {
  const { status, category, search, sort, page, limit } = req.query;
  const filter = { reporter: req.user._id };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { reportId: rx }, { room: rx }];
  }
  const [data, total] = await Promise.all([
    Report.find(filter).populate('building', 'name code')
      .sort(sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 })
      .skip((page - 1) * limit).limit(limit),
    Report.countDocuments(filter),
  ]);
  res.json({ data, meta: { page, limit, total } });
});

export const myStats = asyncHandler(async (req, res) => {
  const match = { reporter: req.user._id };
  const [counts, byCategory] = await Promise.all([
    Report.aggregate([
      { $match: match },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $and: [
            { $in: ['$priority', ['high', 'critical']] },
            { $ne: ['$status', 'resolved'] },
          ] }, 1, 0] } },
      } },
    ]),
    Report.aggregate([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  const c = counts[0] ?? { total: 0, pending: 0, inProgress: 0, resolved: 0, highPriority: 0 };
  res.json({ data: { ...c, _id: undefined, byCategory: byCategory.map((x) => ({ category: x._id, count: x.count })) } });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ reportId: req.params.reportId.toUpperCase() })
    .populate('building', 'name code')
    .populate('history.changedBy', 'name role');
  if (!report) throw new ApiError(404, 'Report not found');
  const isOwner = report.reporter.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(404, 'Report not found');
  res.json({ data: report });
});
```

> Returning 404 (not 403) for other users' reports avoids revealing which IDs exist.

`src/controllers/mapController.js`

```js
import Report from '../models/Report.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const WEIGHT = { low: 0.25, medium: 0.5, high: 0.75, critical: 1 };

const buildFilter = ({ categories, includeResolved }) => {
  const f = {};
  if (categories.length) f.category = { $in: categories };
  if (!includeResolved) f.status = { $ne: 'resolved' };
  return f;
};

export const mapReports = asyncHandler(async (req, res) => {
  const reports = await Report.find(buildFilter(req.query))
    .select('reportId title category priority status room location building createdAt isSample')
    .populate('building', 'name')
    .limit(1000)
    .lean();
  res.json({
    data: reports.map((r) => ({
      reportId: r.reportId, title: r.title, category: r.category, priority: r.priority,
      status: r.status, room: r.room, building: r.building?.name,
      lat: r.location.coordinates[1], lng: r.location.coordinates[0],
      createdAt: r.createdAt, isSample: r.isSample,
    })),
  });
});

export const heatPoints = asyncHandler(async (req, res) => {
  const reports = await Report.find(buildFilter(req.query)).select('priority location').limit(5000).lean();
  res.json({
    data: reports.map((r) => [r.location.coordinates[1], r.location.coordinates[0], WEIGHT[r.priority] ?? 0.5]),
  });
});
```

`src/controllers/adminController.js`

```js
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAllReports = asyncHandler(async (req, res) => {
  const { status, category, page, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  const [data, total] = await Promise.all([
    Report.find(filter).populate('building', 'name').populate('reporter', 'name rollNumber')
      .sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Report.countDocuments(filter),
  ]);
  res.json({ data, meta: { page, limit, total } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const report = await Report.findOne({ reportId: req.params.reportId.toUpperCase() });
  if (!report) throw new ApiError(404, 'Report not found');
  if (report.status === status) throw new ApiError(400, `Report is already ${status.replace('_', ' ')}`);

  report.status = status;
  report.resolvedAt = status === 'resolved' ? new Date() : undefined;
  report.history.push({ status, note, changedBy: req.user._id });
  await report.save();

  await Notification.create({
    user: report.reporter,
    report: report._id,
    message: `${report.reportId} "${report.title}" is now ${status.replace('_', ' ')}`,
  });
  res.json({ data: report });
});
```

`buildingController.js`, `notificationController.js`, `userController.js`

```js
// buildingController.js
import Building from '../models/Building.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listBuildings = asyncHandler(async (_req, res) => {
  const b = await Building.find().sort('name').lean();
  res.json({ data: b.map((x) => ({ id: x._id, name: x.name, code: x.code,
    lat: x.location.coordinates[1], lng: x.location.coordinates[0], isSample: x.isSample })) });
});

// notificationController.js
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listNotifications = asyncHandler(async (req, res) => {
  const [data, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(20).populate('report', 'reportId'),
    Notification.countDocuments({ user: req.user._id, readAt: { $exists: false } }),
  ]);
  res.json({ data, meta: { unreadCount } });
});
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: { $exists: false } }, { readAt: new Date() });
  res.status(204).end();
});

// userController.js
import { asyncHandler } from '../utils/asyncHandler.js';
export const updateMe = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  const u = req.user;
  res.json({ data: { id: u.id, name: u.name, email: u.email, rollNumber: u.rollNumber, role: u.role } });
});
```

### 6.8 Routes (`src/routes/index.js`)

```js
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadImages } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as reports from '../controllers/reportController.js';
import * as map from '../controllers/mapController.js';
import * as admin from '../controllers/adminController.js';
import { listBuildings } from '../controllers/buildingController.js';
import { listNotifications, markAllRead } from '../controllers/notificationController.js';
import { updateMe } from '../controllers/userController.js';
import { registerSchema, loginSchema, googleSchema, updateProfileSchema } from '../validators/authSchemas.js';
import { createReportSchema, listReportsQuery, mapQuery, updateStatusSchema } from '../validators/reportSchemas.js';

const r = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

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

// Map, buildings, notifications
r.get('/map/reports', requireAuth, validate(mapQuery, 'query'), map.mapReports);
r.get('/map/heat', requireAuth, validate(mapQuery, 'query'), map.heatPoints);
r.get('/buildings', requireAuth, listBuildings);
r.get('/notifications', requireAuth, listNotifications);
r.patch('/notifications/read-all', requireAuth, markAllRead);

// Admin
r.get('/admin/reports', requireAuth, requireRole('admin'), validate(listReportsQuery, 'query'), admin.listAllReports);
r.patch('/admin/reports/:reportId/status', requireAuth, requireRole('admin'), validate(updateStatusSchema), admin.updateStatus);

export default r;
```

### 6.9 `src/app.js` and `src/server.js`

```js
// app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
```

```js
// server.js
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

await connectDB();
app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
```

---

## 7. Frontend implementation

### 7.1 Init

```bash
cd campusconnect
npm create vite@latest client -- --template react-ts
cd client
npm i react-router-dom axios lucide-react recharts leaflet react-leaflet leaflet.heat \
      react-hook-form zod @hookform/resolvers
npm i -D tailwindcss @tailwindcss/vite @types/leaflet
```

> `react-leaflet` v4 pairs with React 18; v5 pairs with React 19. Match versions to the React version Vite installs.

### 7.2 `vite.config.ts` (dev proxy avoids CORS and cookie issues)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
```

### 7.3 Design tokens, `src/index.css`

```css
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-500: #1677ff;   /* buttons, active nav */
  --color-primary-600: #0f63e0;
  --color-navy-800: #0b2545;      /* sidebar, auth panel */
  --color-navy-900: #081a33;
  --color-surface: #ffffff;
  --color-canvas: #f4f7fb;
  --color-line: #e3e8ef;
  --color-pending: #ef4444;       /* PDF shows pending as red text on pink */
  --color-progress: #0ea5e9;
  --color-resolved: #16a34a;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

body { @apply bg-canvas text-slate-800 antialiased; }
```

Add the Inter font via `<link>` in `index.html`.

**Visual details from the PDF to replicate**

- Sidebar: dark navy, active item is a lighter blue filled rounded rectangle.
- Stat cards: white, rounded-xl, colored icon tile (red, amber, green, purple) at left, label then bold number.
- Badges: pill shapes. Pending = red text on pink; In Progress = blue text on light blue; Resolved = green on light green. Priority: Low green text, Medium amber, High red (text-only or light pill).
- Landing: full-bleed photo, navy gradient overlay, feature card (white, rounded, right-aligned) with three rows of colored icon tiles (blue, green, indigo).
- Auth: rounded card split 50/50; left navy with photo fading into the bottom, white pin icon + name + "Report · Track · Improve".

### 7.4 Types, `src/types/index.ts`

```ts
export type Role = 'student' | 'admin';
export type Status = 'pending' | 'in_progress' | 'resolved';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Category =
  | 'electrical' | 'plumbing' | 'mechanical' | 'civil' | 'sanitation'
  | 'wifi' | 'hostel' | 'canteen' | 'safety' | 'other';

export interface User {
  id: string; name: string; email: string; rollNumber?: string;
  role: Role; avatarUrl?: string;
}
export interface Building { id: string; name: string; code: string; lat: number; lng: number; isSample: boolean }
export interface HistoryEntry {
  status: Status; note?: string; changedAt: string; changedBy?: { name: string; role: Role };
}
export interface Report {
  _id: string; reportId: string; title: string; description: string;
  category: Category; priority: Priority; status: Status;
  building: { _id: string; name: string; code: string };
  room: string;
  location: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  images: { url: string; filename: string }[];
  history: HistoryEntry[];
  createdAt: string; updatedAt: string;
}
export interface ReportStats {
  total: number; pending: number; inProgress: number; resolved: number; highPriority: number;
  byCategory: { category: Category; count: number }[];
}
export interface MapReport {
  reportId: string; title: string; category: Category; priority: Priority; status: Status;
  room: string; building?: string; lat: number; lng: number; createdAt: string; isSample: boolean;
}
export type HeatPoint = [number, number, number];
export interface Paginated<T> { data: T[]; meta: { page: number; limit: number; total: number } }
```

`src/types/leaflet-heat.d.ts`

```ts
import 'leaflet';
declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number; maxZoom?: number; max?: number;
    radius?: number; blur?: number; gradient?: Record<number, string>;
  }
  function heatLayer(latlngs: Array<[number, number, number?]>, options?: HeatLayerOptions): Layer;
}
declare module 'leaflet.heat';
```

### 7.5 Constants, `src/utils/constants.ts`

```ts
import type { Category, Priority, Status } from '../types';

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing and Water' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'civil', label: 'Civil and Infrastructure' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'wifi', label: 'Wi-Fi and Internet' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
];

export const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved',
};

// Map filter groups (checkboxes in the PDF)
export const MAP_FILTERS = [
  { key: 'electrical', label: 'Electrical', categories: ['electrical'] },
  { key: 'plumbing', label: 'Plumbing', categories: ['plumbing'] },
  { key: 'mechanical', label: 'Mechanical', categories: ['mechanical'] },
  { key: 'civil', label: 'Civil', categories: ['civil'] },
  { key: 'others', label: 'Others', categories: ['sanitation', 'wifi', 'hostel', 'canteen', 'safety', 'other'] },
] as const;

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export const MAP_CENTER: [number, number] = [
  Number(import.meta.env.VITE_MAP_CENTER_LAT ?? 18.4575),
  Number(import.meta.env.VITE_MAP_CENTER_LNG ?? 73.8508),
]; // EXAMPLE coordinate. Replace with your campus in .env
```

### 7.6 Services layer

`src/services/api.ts`

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message
      ?? (err.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check your connection.' : 'Request failed');
  }
  return 'Something went wrong';
};

// Auto-logout on expired session (except for the initial /auth/me probe)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);
```

`src/services/authService.ts`

```ts
import { api } from './api';
import type { User } from '../types';

export const authService = {
  register: (d: { name: string; rollNumber: string; email: string; password: string }) =>
    api.post<{ data: User }>('/auth/register', d).then((r) => r.data.data),
  login: (d: { identifier: string; password: string; remember?: boolean }) =>
    api.post<{ data: User }>('/auth/login', d).then((r) => r.data.data),
  google: (credential: string) =>
    api.post<{ data: User }>('/auth/google', { credential }).then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ data: User }>('/auth/me').then((r) => r.data.data),
};
```

`src/services/reportService.ts`

```ts
import { api } from './api';
import type { Paginated, Report, ReportStats, Status } from '../types';

export interface ReportQuery { status?: Status; search?: string; sort?: string; page?: number; limit?: number }

export const reportService = {
  list: (q: ReportQuery = {}) => api.get<Paginated<Report>>('/reports', { params: q }).then((r) => r.data),
  get: (id: string) => api.get<{ data: Report }>(`/reports/${id}`).then((r) => r.data.data),
  stats: () => api.get<{ data: ReportStats }>('/reports/stats').then((r) => r.data.data),
  create: (form: FormData) =>
    api.post<{ data: Report }>('/reports', form).then((r) => r.data.data),
};
```

`src/services/mapService.ts`

```ts
import { api } from './api';
import type { HeatPoint, MapReport } from '../types';

export const mapService = {
  reports: (categories: string[]) =>
    api.get<{ data: MapReport[] }>('/map/reports', { params: { categories: categories.join(',') } }).then((r) => r.data.data),
  heat: (categories: string[]) =>
    api.get<{ data: HeatPoint[] }>('/map/heat', { params: { categories: categories.join(',') } }).then((r) => r.data.data),
};
```

Also create `buildingService`, `notificationService`, `adminService` in the same style.

### 7.7 Auth context and route guards

`src/context/AuthContext.tsx`

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthState {
  user: User | null; loading: boolean;
  login: typeof authService.login; register: typeof authService.register;
  google: typeof authService.google; logout: () => Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const wrap = <A extends unknown[]>(fn: (...a: A) => Promise<User>) =>
    async (...a: A) => { const u = await fn(...a); setUser(u); return u; };

  const logout = useCallback(async () => { await authService.logout(); setUser(null); }, []);

  const value = useMemo<AuthState>(() => ({
    user, loading, logout,
    login: wrap(authService.login), register: wrap(authService.register), google: wrap(authService.google),
  }), [user, loading, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
};
```

`src/routes/RequireAuth.tsx`

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export default function RequireAuth({ role }: { role?: Role }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid h-screen place-items-center">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

### 7.8 Routing, `src/App.tsx`

```tsx
import { Route, Routes } from 'react-router-dom';
import RequireAuth from './routes/RequireAuth';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportIssuePage from './pages/ReportIssuePage';
import CampusMapPage from './pages/CampusMapPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ProfilePage from './pages/ProfilePage';
import AdminReportsPage from './pages/AdminReportsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportIssuePage />} />
          <Route path="/map" element={<CampusMapPage />} />
          <Route path="/complaints" element={<MyComplaintsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<RequireAuth role="admin" />}>
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

`main.tsx` wraps `<App/>` in `BrowserRouter`, `AuthProvider`, `ToastProvider`, and imports `leaflet/dist/leaflet.css`.

Landing page nav behaviour: "Report Issue" and "Map" links go to `/report` and `/map`; unauthenticated users are redirected to `/login` and returned afterwards via `location.state.from`.

### 7.9 Heat layer hook, `src/hooks/useHeatLayer.ts`

```ts
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { useMap } from 'react-leaflet';
import type { HeatPoint } from '../types';

export function useHeatLayer(points: HeatPoint[], enabled: boolean) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || points.length === 0) return;
    const layer = L.heatLayer(points, {
      radius: 35, blur: 25, maxZoom: 18, max: 1,
      gradient: { 0.2: '#22c55e', 0.5: '#f59e0b', 0.8: '#ef4444' }, // green, amber, red
    }).addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, points, enabled]);
}
```

`HeatLayer.tsx` is a render-nothing component: `export default function HeatLayer(p){ useHeatLayer(p.points,p.enabled); return null; }` (hooks using `useMap` must be inside `<MapContainer>`).

### 7.10 Map components

**Fix default Leaflet marker icons** (common Vite bug) in `src/components/map/leafletIcons.ts`:

```ts
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl: icon, iconRetinaUrl: icon2x, shadowUrl: shadow });
```

Add `declare module '*.png';` in `src/vite-env.d.ts` if TS complains.

**`CampusMap.tsx`** (used by the Map page)

```tsx
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Tooltip } from 'react-leaflet';
import HeatLayer from './HeatLayer';
import { MAP_CENTER } from '../../utils/constants';
import StatusBadge from '../reports/StatusBadge';
import PriorityBadge from '../reports/PriorityBadge';
import type { Building, HeatPoint, MapReport } from '../../types';
import './leafletIcons';

interface Props {
  mode: 'heat' | 'markers';
  heatPoints: HeatPoint[];
  reports: MapReport[];
  buildings: Building[];
}

export default function CampusMap({ mode, heatPoints, reports, buildings }: Props) {
  return (
    <MapContainer center={MAP_CENTER} zoom={17} zoomControl={false} className="h-[60vh] min-h-[360px] w-full rounded-xl lg:h-[calc(100vh-11rem)]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      {buildings.map((b) => (
        <Marker key={b.id} position={[b.lat, b.lng]} opacity={0.0}>
          <Tooltip permanent direction="top" className="campus-label">{b.name}</Tooltip>
        </Marker>
      ))}
      <HeatLayer points={heatPoints} enabled={mode === 'heat'} />
      {mode === 'markers' && reports.map((r) => (
        <Marker key={r.reportId} position={[r.lat, r.lng]}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{r.reportId}: {r.title}</p>
              <p>Category: {r.category}</p>
              <p>Location: {r.building}, {r.room}</p>
              <div className="flex gap-2"><PriorityBadge priority={r.priority} /><StatusBadge status={r.status} /></div>
              {r.isSample && <p className="text-xs text-slate-500">Sample data</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

> Respect OpenStreetMap's tile usage policy. Fine for development and light use; for production traffic use a tile provider with an API key. Keep the attribution.

**`LocationPicker.tsx`** (Report step 2): a `MapContainer` with a `useMapEvents({ click })` handler that sets `{lat,lng}` and renders one draggable marker. When the user picks a building from step 1, auto-center on that building and pre-place the pin there so the user only has to adjust.

### 7.11 Forms and validation

`src/schemas/authSchemas.ts`

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or roll number'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  rollNumber: z.string().trim().min(3, 'Enter your roll number').regex(/^[A-Za-z0-9/_-]+$/, 'Letters, numbers, / _ - only'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter').regex(/[a-z]/, 'Include a lowercase letter').regex(/\d/, 'Include a number'),
});
export type RegisterForm = z.infer<typeof registerSchema>;
```

`src/schemas/reportSchemas.ts`

```ts
import { z } from 'zod';

export const reportSchema = z.object({
  category: z.enum(['electrical','plumbing','mechanical','civil','sanitation','wifi','hostel','canteen','safety','other'],
    { errorMap: () => ({ message: 'Select a category' }) }),
  title: z.string().trim().min(5, 'At least 5 characters').max(120),
  description: z.string().trim().min(10, 'Describe the issue in at least 10 characters').max(2000),
  building: z.string().min(1, 'Select a building'),
  room: z.string().trim().min(1, 'Enter a room or location').max(100),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  lat: z.number({ required_error: 'Pick a location on the map' }),
  lng: z.number({ required_error: 'Pick a location on the map' }),
});
export type ReportForm = z.infer<typeof reportSchema>;
```

Images are kept in separate React state (`File[]`), not in RHF, and validated by `imageValidation.ts`:

```ts
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES } from './constants';

export function validateImages(existing: File[], incoming: File[]) {
  const accepted: File[] = []; const errors: string[] = [];
  for (const f of incoming) {
    if (existing.length + accepted.length >= MAX_IMAGES) { errors.push(`You can upload up to ${MAX_IMAGES} images`); break; }
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) { errors.push(`${f.name}: only JPG or PNG allowed`); continue; }
    if (f.size > MAX_IMAGE_BYTES) { errors.push(`${f.name}: larger than 2 MB`); continue; }
    accepted.push(f);
  }
  return { accepted, errors };
}
```

**ImageUploader**: dashed drop zone (click or drag-drop, keyboard-accessible `<button>`/`<input type="file" multiple accept="image/jpeg,image/png">`), previews via `URL.createObjectURL`, remove button per thumbnail, revoke object URLs on cleanup, inline error list.

### 7.12 Multi-step report flow (key logic)

```tsx
// ReportIssuePage.tsx (outline)
const methods = useForm<ReportForm>({ resolver: zodResolver(reportSchema), defaultValues: { priority: 'medium' }, mode: 'onTouched' });
const [step, setStep] = useState<1 | 2 | 3>(1);
const [images, setImages] = useState<File[]>([]);
const [submitted, setSubmitted] = useState<Report | null>(null);

const STEP_FIELDS = { 1: ['category','title','description','building','room','priority'], 2: ['lat','lng'] } as const;

const next = async () => {
  if (step < 3 && await methods.trigger(STEP_FIELDS[step] as any)) setStep((s) => (s + 1) as 1 | 2 | 3);
};

const submit = methods.handleSubmit(async (v) => {
  const fd = new FormData();
  Object.entries(v).forEach(([k, val]) => fd.append(k, String(val)));
  images.forEach((f) => fd.append('images', f));
  try {
    setSubmitted(await reportService.create(fd));
    toast.success('Report submitted');
  } catch (e) { toast.error(getErrorMessage(e)); }
});
```

- Wrap the page in `<FormProvider {...methods}>`; split steps into `StepDetails`, `StepLocation`, `StepReview` components.
- Do **not** set `Content-Type` manually for FormData. Axios adds the boundary.
- After success: show confirmation card with the complaint ID (e.g. `CP0013`) and a **View My Complaints** link to `/complaints`. Reset form and revoke previews.
- Warn on leaving with unsaved data (optional `useBlocker`).
- Priority label is simply "Priority". No AI wording.

### 7.13 Dashboard data (derived, not hardcoded)

```tsx
const { data: stats } = useReportStats();           // GET /reports/stats
const { data: recent } = useReports({ limit: 4 });  // GET /reports?limit=4&sort=-createdAt
// Cards: stats.total, stats.inProgress, stats.resolved, stats.highPriority
// Doughnut: stats.byCategory → percentages = count / total * 100 (computed in component)
```

Doughnut (Recharts):

```tsx
<ResponsiveContainer width="100%" height={180}>
  <PieChart>
    <Pie data={rows} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
      {rows.map((r) => <Cell key={r.label} fill={r.color} />)}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
```

Legend beside it lists label and `Math.round(count/total*100)%`. Show an empty state if `total === 0`.

### 7.14 Shared component contracts

| Component | Props (summary) |
| --- | --- |
| `StatusBadge` | `status: Status` |
| `PriorityBadge` | `priority: Priority` |
| `StatCard` | \`label, value, icon, tone: 'red' |
| `DataTable<T>` | `columns, rows, onRowClick?, selectedId?, loading?, emptyMessage` (horizontal scroll on mobile) |
| `Stepper` | `steps: string[], current: number` |
| `ImageUploader` | `files, onChange, errors` |
| `FormField` | `label, required?, error?, children`, wires `aria-invalid`, `aria-describedby` |
| `PasswordInput` | show/hide toggle button with `aria-label` and `aria-pressed` |
| `Modal` / `ConfirmDialog` | focus trap, Esc to close, `role="dialog"`, `aria-modal` |
| `Toast` | `success/error/info`, auto-dismiss, `role="status"` |
| `NotificationDropdown` | reads `/notifications`, unread badge, "Mark all read" |
| `StatusTimeline` | `history: HistoryEntry[]` vertical timeline, newest first |
| `ReportDetailPanel` | `report`, image or placeholder, **View Updates** opens timeline modal |
| `Skeleton`, `EmptyState` | used by every list and card |

### 7.15 Responsive behaviour

| Breakpoint | Behaviour |
| --- | --- |
| ≥1024px | Fixed 240px sidebar; hamburger collapses it to icons or hides it |
| 768–1023px | Sidebar hidden by default, toggled by header button (overlay) |
| \<768px | Sidebar is a drawer with backdrop, closes on route change and Esc; stat cards stack; tables scroll horizontally (or switch to cards); map `h-[60vh]`, filter and legend panel moves **below** the map; auth pages stack branding above the form (branding shrinks to a short banner) |

---

## 8. Page-by-page build notes (matching the PDF)

### 8.1 Landing (`/`)

- Transparent navy navbar over the hero: pin icon + "CampusConnect", links Home, Report Issue, Map, About, and an outlined **Login** button (right). Swap Login for **Dashboard** when signed in.
- Hero: left column heading "A Smarter Campus for a Better Tomorrow", supporting text, **Report an Issue** (solid blue → `/report`), **View Campus Map** (outlined white → `/map`).
- Right: white card with three rows: **Report Problems** ("Quickly report issues with photos and location"), **Track Progress** ("Get real-time updates on your complaints"), **See Heat Map** ("Find problem areas across campus"). Each row's icon tile color: blue, green, indigo.
- About link scrolls to an `#about` section below the hero (short mission text and "how it works" 3 steps) so it is not a dead link.
- Mobile: feature card moves below the buttons.

### 8.2 Login (`/login`)

- Fields: identifier (mail icon), password (lock icon + eye toggle), Remember me, Forgot password, **Login**, "OR" divider, **Login with Google**, "Don't have an account? Sign Up".
- Loading state: spinner and disabled button. Friendly errors from the API ("Incorrect email/roll number or password").
- **Forgot password**: link to `/forgot-password` page that explains the flow; real reset email requires an email service (Nodemailer + token model). Mark as Phase 2, and until then show an honest "Contact your campus admin" notice instead of a dead link.
- **Google**: use Google Identity Services (`@react-oauth/google`), send `credential` to `/auth/google`. If `VITE_GOOGLE_CLIENT_ID` is missing, render the button disabled with the tooltip "Google login not configured".

### 8.3 Register (`/register`)

- Fields: Full Name (user icon), Roll Number / Student ID (clipboard icon), Email (mail icon), Password (lock + eye). **Sign Up**. "Already have an account? Login".
- Show password rules hint under the field. On success go to `/dashboard`.

### 8.4 Dashboard (`/dashboard`)

- Greeting "Hello, {user.name}", subtitle "Here's what's happening on your campus".
- 4 stat cards (red Total Complaints, amber In Progress, green Resolved, purple High Priority).
- Recent Complaints table (ID, Issue, Location, Category, Priority, Status, Date) with **View All** → `/complaints`; row click → `/complaints?selected=CP0012`.
- Issue Categories doughnut and Quick Actions (**Report New Issue** → `/report`, **View Campus Map** → `/map`).

### 8.5 Report an Issue (`/report`)

- Stepper: 1 Issue Details, 2 Location, 3 Review.
- Step 1: left card (category select, title, description, photos), right card "Additional Information" (building, room/location, priority) and the **Next** button.
- Step 2: building dropdown summary, interactive `LocationPicker`, lat/lng readout, room confirmation field.
- Step 3: summary card (category, title, description, building and room, priority, map thumbnail or coordinates, photo thumbnails), **Back** and **Submit Report**.
- Success: confirmation message, complaint ID, link to My Complaints, "Report another issue".

### 8.6 Campus Map (`/map`)

- Heading, large map (about 70% width), right panel with **Heat Map Legend** (red High, amber Medium, green Low density) and **Filter by Category** checkboxes (All, Electrical, Plumbing, Mechanical, Civil, Others).
- Checkbox logic: "All" checked = no filter. Checking a specific category unchecks All. Unchecking the last category re-checks All.
- View toggle: Heat Map / Markers (segmented control). Markers show popups with category, severity (priority), status and location.
- Banner or small caption: "Showing sample data" when any returned item has `isSample: true`.
- Refetch via `mapService` whenever filters change; debounce lightly and show a loading overlay on the map.

### 8.7 My Complaints (`/complaints`)

- Tabs: All, Pending, In Progress, Resolved (use `role="tablist"`). Tab maps to `?status=` query to the API.
- Search box and sort dropdown above the table (title, ID, date, priority).
- Table columns: ID, Title, Location, Category, Priority, Status, Date. Click or Enter on a row selects it. First row auto-selected.
- Right detail card: image (first uploaded photo or placeholder icon), title with status badge, ID, Location, Category, Priority, Description, "Reported on" date and time, **View Updates**.
- **View Updates** → modal with `StatusTimeline` from `report.history` (status, note, who, when). Support deep link `?selected=`.
- Mobile: detail card appears below the table (or as a full-screen sheet when a row is tapped).

### 8.8 Profile (`/profile`)

Show name, email, roll number, role. Edit name and roll number (`PATCH /users/me`). Logout button. (No PDF screen: keep it simple and consistent.)

### 8.9 Admin Reports (`/admin/reports`, optional, not in PDF)

Table of all reports with status filter and a "Change status" dialog (status select and note) calling `PATCH /admin/reports/:id/status`. Sidebar shows an **Admin** link only when `user.role === 'admin'`.

### 8.10 Header (all dashboard pages)

Hamburger toggle, notification bell with unread count and dropdown, avatar (initials fallback), name with dropdown (Profile, Logout). Logout opens `ConfirmDialog`, then calls `logout()` and navigates to `/login`.

---

## 9. Authentication and security

| Concern | Approach |
| --- | --- |
| Password storage | bcrypt (cost 12), `passwordHash` excluded by `select: false` |
| Session | JWT in **httpOnly, Secure (prod), SameSite** cookie; not accessible to JS, so safer against XSS theft than localStorage |
| CSRF | SameSite=Lax in dev. If you deploy client and API on different sites (SameSite=None), add CSRF protection (double-submit token) |
| Brute force | `express-rate-limit` on auth routes; consider account lockout later |
| Account enumeration | identical login error for wrong user or password |
| Input validation | Zod on every body and query; regex escaping for search |
| NoSQL injection | schema-typed Zod parsing means objects like `{ "$gt": "" }` are rejected |
| Authorization | ownership check on every report read; admin routes behind `requireRole` |
| Uploads | type and size limits, random filenames, no executable types; add magic-byte check and cloud storage for production |
| Headers | `helmet` |
| Secrets | `.env` never committed; `JWT_SECRET` ≥ 32 random chars |
| Privacy | Map endpoints omit reporter identity |
| Google login | ID token verified server-side with `google-auth-library`; requires a Google Cloud OAuth client ID |

Things this guide does **not** include and you may need later: email verification, password reset emails, refresh tokens, audit logging, image virus scanning, push notifications.

---

## 10. Environment variables and setup commands

### `server/.env.example`

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/campusconnect
JWT_SECRET=replace-with-a-long-random-string-at-least-32-chars
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
UPLOAD_DIR=uploads
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### `client/.env.example`

```
VITE_API_URL=/api
VITE_MAP_CENTER_LAT=18.4575
VITE_MAP_CENTER_LNG=73.8508
VITE_GOOGLE_CLIENT_ID=
```

(Map center is an **example coordinate**. Replace with your campus.)

### Run locally

```bash
# 1. MongoDB: local install, Docker, or Atlas
docker run -d --name mongo -p 27017:27017 mongo:7

# 2. API
cd server && cp .env.example .env     # edit values
npm install
npm run seed                          # demo users, buildings, 12 sample reports
npm run dev                           # http://localhost:5000

# 3. Client (new terminal)
cd client && cp .env.example .env
npm install
npm run dev                           # http://localhost:5173
```

Demo logins after seeding (change or delete before any real deployment):

- Student: `user123@example.edu` / `Password@123`
- Admin: `admin@example.edu` / `Admin@12345`

### `.gitignore` (root)

```
node_modules
.env
server/uploads/*
!server/uploads/.gitkeep
dist
```

---

## 11. Seed data

`server/src/seed/seed.js` (clears collections, then inserts). All coordinates below are **sample points** near the example center and are flagged `isSample: true`. They are hand-placed, not random, and are not real complaints.

```js
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Building from '../models/Building.js';
import Report from '../models/Report.js';
import Counter from '../models/Counter.js';
import Notification from '../models/Notification.js';

const C = { lat: 18.4575, lng: 73.8508 }; // example campus center. Replace later.

// code, name, dLat, dLng (offsets in degrees; ~0.0001 ≈ 11 m)
const BUILDINGS = [
  ['LIB',  'Library',          0.0012, -0.0016],
  ['ACD',  'Academic Block',   0.0004,  0.0003],
  ['HOS',  'Hostel',           0.0016,  0.0014],
  ['BLA',  'Block A',         -0.0006, -0.0010],
  ['BLB',  'Block B',         -0.0014,  0.0012],
  ['CAN',  'Canteen',         -0.0002,  0.0020],
  ['GATE', 'Main Gate',       -0.0020, -0.0004],
];

// id, title, buildingCode, room, category, priority, status, daysAgo, [dLat,dLng jitter], description
const REPORTS = [
  [12, 'Leaking tap',        'BLA', 'Room 104',   'plumbing',   'medium', 'in_progress', 11, [ 0.00004,  0.00003], 'The tap in the washroom is leaking and wasting water.'],
  [11, 'Electrical issue',   'HOS', 'Ground floor','electrical','high',   'pending',     12, [-0.00005,  0.00004], 'Sparks seen near the corridor switchboard.'],
  [10, 'Broken fan',         'ACD', 'Class 104',  'mechanical', 'medium', 'resolved',    13, [ 0.00003, -0.00004], 'Ceiling fan does not rotate.'],
  [ 9, 'Water leakage',      'LIB', 'Reading hall','plumbing',  'low',    'resolved',    15, [ 0.00005,  0.00002], 'Water dripping from the ceiling near the shelves.'],
  [ 8, 'Damaged bench',      'CAN', 'Outdoor seating','civil', 'low',    'resolved',    17, [-0.00003,  0.00005], 'Bench slats are broken.'],
  [ 7, 'Flickering lights',  'LIB', '2nd floor',  'electrical', 'high',   'in_progress', 18, [-0.00004, -0.00003], 'Lights flicker constantly.'],
  [ 6, 'Wi-Fi dropouts',     'HOS', 'Wing C',     'wifi',       'medium', 'in_progress', 20, [ 0.00006, -0.00002], 'Connection drops every few minutes.'],
  [ 5, 'Cracked pavement',   'GATE','Entrance path','civil',    'medium', 'in_progress', 22, [ 0.00002,  0.00006], 'Large crack is a tripping hazard.'],
  [ 4, 'Overflowing bin',    'CAN', 'Back entrance','sanitation','low',   'resolved',    24, [ 0.00004, -0.00005], 'Waste bin overflowing daily.'],
  [ 3, 'Projector not working','ACD','Seminar hall','electrical','medium','resolved',    26, [-0.00002,  0.00004], 'Projector shows no signal.'],
  [ 2, 'Lift out of service','BLB', 'Lift 1',     'mechanical', 'medium', 'in_progress', 28, [ 0.00003,  0.00003], 'Lift stuck on ground floor.'],
  [ 1, 'Door lock broken',   'HOS', 'Room 210',   'civil',      'low',    'resolved',    30, [-0.00004,  0.00002], 'Door lock jammed.'],
];

await connectDB();
await Promise.all([User, Building, Report, Counter, Notification].map((m) => m.deleteMany({})));

const [student, admin] = await User.create([
  { name: 'User 123', rollNumber: 'CS2025001', email: 'user123@example.edu', role: 'student',
    passwordHash: await User.hashPassword('Password@123') },
  { name: 'Campus Admin', email: 'admin@example.edu', role: 'admin',
    passwordHash: await User.hashPassword('Admin@12345') },
]);

const buildings = await Building.insertMany(BUILDINGS.map(([code, name, dLat, dLng]) => ({
  code, name, isSample: true,
  location: { type: 'Point', coordinates: [C.lng + dLng, C.lat + dLat] },
})));
const byCode = Object.fromEntries(buildings.map((b) => [b.code, b]));

const day = 24 * 60 * 60 * 1000;
for (const [n, title, code, room, category, priority, status, daysAgo, [jLat, jLng], description] of REPORTS.sort((a, b) => a[0] - b[0])) {
  const b = byCode[code];
  const created = new Date(Date.now() - daysAgo * day);
  const history = [{ status: 'pending', note: 'Report submitted', changedBy: student._id, changedAt: created }];
  if (status !== 'pending') history.push({ status: 'in_progress', note: 'Assigned to maintenance team', changedBy: admin._id, changedAt: new Date(created.getTime() + day) });
  if (status === 'resolved') history.push({ status: 'resolved', note: 'Issue fixed and verified', changedBy: admin._id, changedAt: new Date(created.getTime() + 3 * day) });

  await Report.create({
    reportId: `CP${String(n).padStart(4, '0')}`, title, description, category, priority, status, room,
    building: b._id, reporter: student._id, history, isSample: true,
    resolvedAt: status === 'resolved' ? history.at(-1).changedAt : undefined,
    location: { type: 'Point', coordinates: [b.location.coordinates[0] + jLng, b.location.coordinates[1] + jLat] },
    createdAt: created, updatedAt: history.at(-1).changedAt,
  });
}
await Counter.create({ _id: 'report', seq: REPORTS.length });

console.log('Seeded: 2 users, 7 buildings, 12 sample reports');
await mongoose.disconnect();
```

Resulting dashboard for the demo student: Total 12, In Progress 5, Resolved 6, High Priority 2, matching the PDF, **computed from the database**.

To get a visually richer heat map for demos, add more sample reports near the Library and Hostel (clearly still flagged `isSample`).

---

## 12. Testing and QA checklist

### Backend (Vitest + Supertest + mongodb-memory-server)

Minimum tests:

- Register: success; duplicate email 409; weak password 400.
- Login: by email, by roll number; wrong password 401 (same message as unknown user).
- `GET /reports` requires auth; only returns own reports.
- `GET /reports/:id` for another user's report returns 404.
- `POST /reports`: valid payload creates `CPxxxx`; >5 images rejected; >2 MB rejected; non-image rejected.
- `GET /reports/stats` counts correct.
- `PATCH /admin/.../status`: student gets 403; admin success creates history and notification.
- `/map/heat` respects `categories` and excludes resolved by default.

Example:

```js
import request from 'supertest';
import app from '../src/app.js';

it('rejects unauthenticated report list', async () => {
  const res = await request(app).get('/api/reports');
  expect(res.status).toBe(401);
});
```

### Frontend manual QA

- [ ] All 8+ routes load, no console errors, `npm run build` and `npx tsc --noEmit` pass
- [ ] Unauthenticated access to `/dashboard` redirects to `/login` and returns after login
- [ ] Login/Register validation messages, show/hide password, loading and API error states
- [ ] Dashboard numbers match the Complaints table
- [ ] Report: step validation blocks Next; 6th image rejected; 3 MB image rejected; preview and remove work; map pin required; submit shows new ID; new report appears in My Complaints and on the map
- [ ] Map: checkboxes filter heat and markers; toggle works; popup shows category, severity, status, location; zoom works; sample-data notice shows
- [ ] My Complaints: tabs filter; search and sort work; row click updates details; View Updates timeline opens
- [ ] Admin changes status, then student sees new timeline entry and a notification
- [ ] Mobile (≈375 px): drawer sidebar, stacked cards, scrollable tables, map usable, auth stacked
- [ ] Keyboard: tab order, focus rings, Esc closes modals and drawer; labels on all inputs

---

## 13. Deployment

| Piece | Option |
| --- | --- |
| Database | MongoDB Atlas (free tier). Add a DB user and allow the API host's IP |
| API | Render / Railway / Fly.io. Set env vars, `npm start`. `trust proxy` already enabled |
| Client | Vercel / Netlify / Cloudflare Pages. Set `VITE_API_URL=https://your-api.example.com/api` |
| Images | Replace local disk with Cloudinary or S3 (Render and similar hosts have ephemeral disks, so uploaded files are lost on redeploy) |

Cross-site cookies: with client and API on different domains, the cookie uses `SameSite=None; Secure` (already set when `NODE_ENV=production`), `CLIENT_URL` must exactly match the client origin, and you should add CSRF protection. Simpler alternative: put both behind one domain (e.g. serve the built client from Express, or use a reverse proxy with `/api`).

Add a SPA rewrite on the client host (all routes to `index.html`).

---

## 14. Antigravity workflow and prompts

### Setup

1. New workspace, **Planning** mode. Put the PDF in `/reference/` and this guide in `/docs/`.
2. Create `GEMINI.md` (or your agent's rules file):

```
Project: CampusConnect, MERN stack. Monorepo: /client (Vite React TS Tailwind), /server (Express Mongoose, ESM JS).
Follow /docs/CampusConnect_MERN_Complete_Guide.md exactly for models, routes, and folder structure.
Visual reference: /reference/CampusConnect_Frontend_Pages_User123.pdf. Match layout, colors, spacing.
Rules: strict TypeScript; no dead buttons or broken routes; UI never calls axios directly (only services/);
validate all input with Zod; no hardcoded stats; no "AI" wording; label sample data; no secrets in code.
Work one phase at a time. Show the plan and wait for approval. Run build/tests after each phase.
```

### Phase prompts (paste one at a time)

**Phase 1: Server foundation**

> Read the guide sections 4, 5, 6. Scaffold `/server`: package.json (ESM), config/env, db, all five Mongoose models, utils, middleware, app.js, server.js, and `/api/health`. Don't build controllers yet. Run the server and confirm it connects to MongoDB.

**Phase 2: Auth API**

> Implement auth controller, validators, routes (register, login, google, logout, me, users/me) per the guide. Add Vitest + Supertest tests for register/login/me. Run tests.

**Phase 3: Reports, map, buildings, notifications, admin API**

> Implement the remaining controllers, validators, upload middleware and routes. Write `seed.js` per section 11. Run `npm run seed`, then verify each endpoint with Supertest or curl. Confirm stats return 12/5/6/2 for the demo student.

**Phase 4: Client foundation**

> Scaffold `/client` per section 7.1 to 7.8: Tailwind v4 tokens from the PDF, types, constants, services layer, AuthContext, RequireAuth, router with placeholder pages. Build UI primitives (Button, Input, Select, Badge, Card, DataTable, Modal, Toast, Skeleton, EmptyState, Stepper).

**Phase 5: Layouts, landing, auth pages**

> Build Navbar, AuthLayout, DashboardLayout (sidebar drawer on mobile, header, notification and profile dropdowns), LandingPage, LoginPage, RegisterPage matching PDF pages 1 to 3. Use my photo at `client/public/images/campus-hero.jpg`. Open the browser agent and compare each screen with the PDF; list differences and fix them.

**Phase 6: Dashboard**

> Build DashboardPage per 8.4 with stats from `/reports/stats`, Recent Complaints, CategoryDoughnut, QuickActions. Compare to PDF page 4.

**Phase 7: Report flow**

> Build the three-step ReportIssuePage, ImageUploader (5 files, 2 MB, JPG/PNG), LocationPicker, review step and success state per 7.11, 7.12, 8.5. Test file-limit errors in the browser.

**Phase 8: Map**

> Build CampusMapPage, CampusMap, HeatLayer + useHeatLayer, legend, checkbox filters, view toggle, marker popups, per 7.9, 7.10, 8.6. Fix default marker icons. Compare to PDF page 5.

**Phase 9: My Complaints + timeline**

> Build MyComplaintsPage, tabs, search, sort, ReportDetailPanel, StatusTimeline modal, per 8.7. Add AdminReportsPage and verify the end-to-end status change and notification.

**Phase 10: Polish and verify**

> Responsive pass at 375, 768, 1280 widths; accessibility pass (labels, focus, keyboard); run `npx tsc --noEmit`, `npm run build`, server tests. Use the browser agent to run the full QA checklist in section 12 and report failures.

**Phase 11: Docs**

> Write the root README with setup, env vars, demo accounts, scripts, and what is mocked or not implemented.

### Tips

- Review the agent's plan artifact before approving each phase.
- If the agent drifts from the PDF, ask: "Screenshot `/dashboard` and compare against PDF page 4; list each visual difference."
- Commit to Git after each passing phase so you can roll back.

---

## 15. Corrections to the PDF and known gaps

**Wording**

- "Priority (auto-detected by AI)" → **"Priority"** (manual selection; no AI exists).
- "AI-powered insights" on the landing card → **"Find problem areas across campus."**

**Design inconsistencies**

- The PDF shows "User 123" and a partly cut-off "Patil" in headers; use one name from the logged-in user everywhere.
- The Doughnut legend in the PDF is partly garbled and its percentages (25/20/20/15/20) are illustrative; real values are computed.
- The map filters are **checkboxes** in the PDF (multi-select) while the original prompt listed single-select. This guide uses checkboxes.
- The PDF has no screens for Profile, Forgot Password, About, or Admin. This guide specifies simple versions so no link is dead.
- PDF imagery is AI-generated mockup art. Use your own campus photo (or one with a license that permits use) and your own leak photo or a placeholder.

**Not covered by the PDF but required for a working system**

- Admin or staff workflow to change status.
- Notification generation (done on admin status change).
- Email verification and password reset (needs an email provider).
- Real campus coordinates and building boundaries (replace seeds and `.env` center).

---

## 16. Build order checklist

- [ ] Git repo, `client/` and `server/` scaffolds
- [ ] MongoDB running; `.env` files created
- [ ] Models, middleware, app and server boot
- [ ] Auth API and tests
- [ ] Reports, map, buildings, notifications, admin API
- [ ] Seed script run; stats 12/5/6/2
- [ ] Tailwind tokens, types, services, AuthContext, routing
- [ ] UI primitives and layouts
- [ ] Landing, Login, Register
- [ ] Dashboard
- [ ] Report flow with uploads and map picker
- [ ] Campus map with heat layer, filters, popups
- [ ] My Complaints, details, timeline
- [ ] Admin status update, notifications dropdown
- [ ] Profile, logout, 404
- [ ] Responsive and accessibility pass
- [ ] Type check, build, tests, manual QA
- [ ] README and deployment