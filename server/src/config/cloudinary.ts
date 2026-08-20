import { v2 as cloudinary } from 'cloudinary';

export const isCloudinaryConfigured = (): boolean =>
  Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
        process.env.CLOUDINARY_API_KEY?.trim() &&
        process.env.CLOUDINARY_API_SECRET?.trim())
  );

export const configureCloudinary = (): void => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL.trim(),
      secure: true,
    });
  } else if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
      api_key: process.env.CLOUDINARY_API_KEY?.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
      secure: true,
    });
  }
};

configureCloudinary();

export { cloudinary };
