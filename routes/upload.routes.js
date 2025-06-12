import express from "express";
import upload from "../middlewares/upload.js";
import {
  securityMiddleware,
  validateFileUpload,
} from "../middlewares/inputValidationMiddleware.js";

const router = express.Router();

router.post(
  "/upload",
  securityMiddleware,
  upload.single("image"),
  validateFileUpload({ fileTypes: ["image"], maxSize: 5 * 1024 * 1024 }),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ imageUrl: req.file.path });
  }
);
router.get("/upload", securityMiddleware, (req, res) => {
  res.render("upload");
});
export default router;
