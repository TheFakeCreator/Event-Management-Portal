import * as express from 'express';
import { Router, Request, Response } from 'express';
import { upload } from '../middlewares/upload.js';
import cloudinary from '../configs/cloudinary.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router: Router = express.Router();

// POST /api/v1/uploads
// Accepts multipart/form-data (field name: 'image') and uploads to Cloudinary.
router.post(
  '/',
  isAuthenticated,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Multer memoryStorage gives us a buffer on req.file.buffer
      const buffer = (req.file as any).buffer as Buffer | undefined;
      if (!buffer) {
        return res
          .status(500)
          .json({ success: false, message: 'No file buffer available' });
      }

      // Use upload_stream to stream the buffer to Cloudinary
      const streamUpload = () =>
        new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: req.body.folder || 'uploads', resource_type: 'image' },
            (error: any, result: any) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          stream.end(buffer);
        });

      const result = await streamUpload();

      return res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          imageUrl: result.secure_url,
          publicId: result.public_id,
          raw: result,
        },
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message,
      });
    }
  }
);

export default router;
