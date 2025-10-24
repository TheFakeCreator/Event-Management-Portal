import express from "express";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ imageUrl: req.file.path });
});
router.get("/upload", (req, res) => {
  res.render("upload");
});
export default router;
