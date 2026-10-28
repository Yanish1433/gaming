import fs from 'node:fs';
import multer from 'multer';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // A rejected request shouldn't leave its upload behind.
  if (req.file?.path) fs.unlink(req.file.path, () => {});
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large (max 5 MB)';
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = Object.values(err.errors)[0]?.message || 'Validation failed';
  } else if (err?.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {})[0] || 'Value'} already in use`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Server error';
  }
  if (!(err instanceof ApiError) && status === 500 && err.expose) status = 400;
  res.status(status).json({ error: message });
}
