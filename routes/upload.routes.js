import express from "express";
import upload from "../middlewares/upload.js";
import {
  securityMiddleware,
  validateFileUpload,
} from "../middlewares/inputValidationMiddleware.js";
import {
  fileUploadRateLimit,
  enhancedFileValidation,
  fileUploadErrorHandler,
} from "../middlewares/fileSecurityMiddleware.js";

const router = express.Router();

router.post(
  "/upload",
  securityMiddleware,
  fileUploadRateLimit,
  upload.single("image"),
  validateFileUpload({ fileTypes: ["image"], maxSize: 5 * 1024 * 1024 }),
  enhancedFileValidation,
  fileUploadErrorHandler,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({
      imageUrl: req.file.path,
      securityHash: req.file.securityHash,
      message: "File uploaded successfully",
    });
  }
);

router.get("/upload", securityMiddleware, (req, res) => {
  res.render("upload");
});

export default router;
