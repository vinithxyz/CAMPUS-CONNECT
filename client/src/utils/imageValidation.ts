import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES } from './constants';

export function validateImages(existing: File[], incoming: File[]) {
  const accepted: File[] = [];
  const errors: string[] = [];
  for (const f of incoming) {
    if (existing.length + accepted.length >= MAX_IMAGES) {
      errors.push(`You can upload up to ${MAX_IMAGES} images`);
      break;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      errors.push(`${f.name}: only JPG or PNG allowed`);
      continue;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      errors.push(`${f.name}: larger than 2 MB`);
      continue;
    }
    accepted.push(f);
  }
  return { accepted, errors };
}
