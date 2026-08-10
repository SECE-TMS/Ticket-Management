import multer, { MulterError } from 'multer';
import type { Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import { IMAGE_MIMES, AUDIO_MIMES } from '../utils/upload';
import type { AuthRequest } from '../types/auth';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (IMAGE_MIMES.has(file.mimetype) || AUDIO_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        'Invalid file type. Allowed: jpeg, png, webp, mpeg, wav, webm, mp4',
        'INVALID_FILE_TYPE'
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const singleAttachment =
  (fieldName = 'attachment') =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, _res, (err: unknown) => {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(ApiError.badRequest('File too large (max 10MB)', 'FILE_TOO_LARGE'));
          return;
        }
        next(ApiError.badRequest(err.message, 'UPLOAD_ERROR'));
        return;
      }
      if (err) {
        next(err);
        return;
      }

      if (req.file) {
        const isImage = IMAGE_MIMES.has(req.file.mimetype);
        const max = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (req.file.size > max) {
          next(
            ApiError.badRequest(
              isImage ? 'Image must be <= 5MB' : 'Audio must be <= 10MB',
              'FILE_TOO_LARGE'
            )
          );
          return;
        }
      }
      next();
    });
  };
