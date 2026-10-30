import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import ChatAttachment from '../../models/ChatAttachment.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

/** After multer: verify real image type, strip metadata (EXIF GPS), save records. */
export async function uploadAttachments(req, res) {
  const out = [];
  for (const f of req.files ?? []) {
    let meta;
    try {
      meta = await sharp(f.path).metadata();
    } catch {
      meta = null;
    }
    if (!meta || !['jpeg', 'png'].includes(meta.format)) {
      await fs.rm(f.path, { force: true });
      throw new ApiError(400, `${f.originalname} is not a valid JPG or PNG image`);
    }
    const buf = await sharp(f.path).rotate().toBuffer({ resolveWithObject: false }); // sharp drops metadata by default
    await fs.writeFile(f.path, buf);
    const doc = await ChatAttachment.create({
      user: req.user._id,
      file: f.filename,
      url: `/uploads/${f.filename}`,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: buf.length,
    });
    out.push({ id: String(doc._id), url: doc.url });
  }
  res.status(201).json({ data: out });
}

/** Smaller copy for the LLM only (cuts tokens). */
export async function imageBlocks(attachments = []) {
  if (!attachments || !attachments.length) return [];
  return Promise.all(
    attachments.map(async (a) => {
      try {
        const filePath = path.resolve(env.UPLOAD_DIR, a.file);
        const data = await sharp(filePath)
          .resize({ width: 1568, height: 1568, fit: 'inside', withoutEnlargement: true })
          .toBuffer();
        return {
          type: 'image',
          source: { type: 'base64', media_type: a.mimeType || 'image/jpeg', data: data.toString('base64') },
        };
      } catch (err) {
        console.warn('Failed to load image block for attachment:', a._id, err);
        return null;
      }
    })
  ).then((blocks) => blocks.filter(Boolean));
}
