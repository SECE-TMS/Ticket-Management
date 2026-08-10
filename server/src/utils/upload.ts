import path from 'path';
import fs from 'fs';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import ApiError from './apiError';

export type AttachmentType = 'image' | 'audio';

export interface UploadedAttachment {
  url: string;
  type: AttachmentType;
  publicId: string | null;
}

export interface UploadableFile {
  mimetype: string;
  size: number;
  buffer: Buffer;
  originalname: string;
}

export const uploadsDir = path.join(__dirname, '../../uploads');

const ensureUploadsDir = (): void => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

export const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/mp4',
  'video/webm',
]);

export const getAttachmentType = (mimetype: string): AttachmentType | null => {
  if (IMAGE_MIMES.has(mimetype)) return 'image';
  if (AUDIO_MIMES.has(mimetype)) return 'audio';
  return null;
};

export const uploadBuffer = async (
  file: UploadableFile | undefined | null,
  folder = 'tms'
): Promise<UploadedAttachment | null> => {
  if (!file) return null;

  const type = getAttachmentType(file.mimetype);
  if (!type) {
    throw ApiError.badRequest(
      'Invalid file type. Allowed: jpeg, png, webp, mpeg, wav, webm, mp4',
      'INVALID_FILE_TYPE'
    );
  }

  const maxBytes = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw ApiError.badRequest(
      type === 'image' ? 'Image must be <= 5MB' : 'Audio must be <= 10MB',
      'FILE_TOO_LARGE'
    );
  }

  if (isCloudinaryConfigured()) {
    const resourceType = type === 'image' ? 'image' : 'video';
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (err, res) => (err ? reject(err) : resolve(res as UploadApiResponse))
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      type,
      publicId: result.public_id,
    };
  }

  ensureUploadsDir();
  const ext = path.extname(file.originalname) || (type === 'image' ? '.jpg' : '.mp3');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, file.buffer);

  return {
    url: `/uploads/${filename}`,
    type,
    publicId: null,
  };
};
