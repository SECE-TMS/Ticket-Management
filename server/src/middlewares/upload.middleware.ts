import multer, { MulterError } from 'multer';
import type { Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import { getAttachmentType } from '../utils/upload';
import type { AuthRequest } from '../types/auth';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const type = getAttachmentType(file.mimetype);
  if (type) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        'Invalid file type. Only image and audio files are allowed.',
        'INVALID_FILE_TYPE'
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 }, // Up to 10 files, max 25MB each
});

export const anyAttachment = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  upload.any()(req, _res, (err: unknown) => {
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(ApiError.badRequest('File too large (max 25MB per file)', 'FILE_TOO_LARGE'));
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        next(ApiError.badRequest('Maximum 10 attachments allowed', 'TOO_MANY_FILES'));
        return;
      }
      next(ApiError.badRequest(err.message, 'UPLOAD_ERROR'));
      return;
    }
    if (err) {
      next(err);
      return;
    }

    const files = (req.files as Express.Multer.File[]) || [];
    for (const f of files) {
      const type = getAttachmentType(f.mimetype);
      const max = type === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
      if (f.size > max) {
        next(
          ApiError.badRequest(
            type === 'image' ? 'Image must be <= 10MB' : 'Audio must be <= 25MB',
            'FILE_TOO_LARGE'
          )
        );
        return;
      }
    }
    next();
  });
};

export const singleAttachment =
  (_fieldName = 'attachment') =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    anyAttachment(req, res, next);
  };
