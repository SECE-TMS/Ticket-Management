import path from 'path';
import fs from 'fs';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import ApiError from './apiError';

export type AttachmentType = 'image' | 'audio' | 'video';

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

export const getAttachmentType = (mimetype: string): AttachmentType | null => {
  if (!mimetype) return null;
  const cleanMime = mimetype.split(';')[0].toLowerCase().trim();
  if (cleanMime.startsWith('image/')) return 'image';
  if (cleanMime.startsWith('audio/')) return 'audio';
  if (cleanMime.startsWith('video/')) return 'video';
  return null;
};

const saveFileLocally = (file: UploadableFile, type: AttachmentType): UploadedAttachment => {
  ensureUploadsDir();
  const ext =
    path.extname(file.originalname) ||
    (type === 'image' ? '.jpg' : type === 'audio' ? '.mp3' : '.mp4');
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, new Uint8Array(file.buffer));

  return {
    url: `/uploads/${filename}`,
    type,
    publicId: null,
  };
};

export const uploadBuffer = async (
  file: UploadableFile | undefined | null,
  folder = 'tms'
): Promise<UploadedAttachment | null> => {
  if (!file) return null;

  const type = getAttachmentType(file.mimetype);
  if (!type) {
    throw ApiError.badRequest(
      'Invalid file type. Only image, audio, and video files are allowed.',
      'INVALID_FILE_TYPE'
    );
  }

  const maxBytes =
    type === 'image'
      ? 15 * 1024 * 1024
      : type === 'audio'
      ? 30 * 1024 * 1024
      : 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw ApiError.badRequest(
      `File size exceeds maximum allowed limit (${
        type === 'image' ? '15MB' : type === 'audio' ? '30MB' : '100MB'
      })`,
      'FILE_TOO_LARGE'
    );
  }

  const isCloudValid = isCloudinaryConfigured();

  if (isCloudValid) {
    try {
      configureCloudinary();
      const resourceType = type === 'image' ? 'image' : type === 'audio' ? 'video' : 'auto';
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (err, res) => (err ? reject(err) : resolve(res as UploadApiResponse))
        );
        stream.end(file.buffer);
      });

      return {
        url: result.secure_url,
        type,
        publicId: result.public_id,
      };
    } catch (err: any) {
      console.warn('Cloudinary upload failed, falling back to local file storage:', err?.message || err);
      return saveFileLocally(file, type);
    }
  }

  // Local storage fallback when Cloudinary is not configured
  return saveFileLocally(file, type);
};
