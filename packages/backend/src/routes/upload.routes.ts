import * as express from 'express';
import { Router, Request, Response } from 'express';
import { upload } from '../middlewares/upload.js';

const router: Router = express.Router();

// API Routes (JSON responses)
router.post('/', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      imageUrl: req.file.path,
    },
  });
});

export default router;
