import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../configs/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "event_images", // Cloudinary folder name
    format: async () => "jpg", // Convert images to JPG format
    public_id: (req, file) => file.originalname.split(".")[0], // Keep original filename
  },
});

const upload = multer({ storage });

export default upload;
