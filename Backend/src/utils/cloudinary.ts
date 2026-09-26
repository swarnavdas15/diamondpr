import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer directly to Cloudinary
 * @param fileBuffer Buffer from multer (req.file.buffer)
 * @param filename Original name of the file
 * @returns Cloudinary secure URL
 */
export const uploadToCloudinary = (fileBuffer: Buffer, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'flange_erp_drawings',
        resource_type: 'auto', // Auto-detects image, raw PDF, CAD files
        public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Cloudinary upload failed with no URL returned.'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};