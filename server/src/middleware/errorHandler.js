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
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Each image must be 2 MB or smaller'
        : err.code === 'LIMIT_FILE_COUNT'
        ? 'You can upload up to 5 images'
        : err.message;
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
