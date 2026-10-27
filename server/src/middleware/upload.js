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
