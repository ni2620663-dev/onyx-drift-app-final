import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Story from "../models/Story.js";

const router = express.Router();

// ক্লাউডিনারি স্টোরেজ কনফিগ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "onyx_stories",
    allowed_formats: ["jpg", "png", "jpeg", "gif"],
  },
});

const upload = multer({ storage: storage });

// পোস্ট রাউট
router.post("/", upload.single("media"), async (req, res) => {
  try {
    // ইমেজ URL চেক
    const mediaUrl = req.file ? req.file.path : null;

    if (!mediaUrl) {
      return res.status(400).json({ message: "Image upload failed on Cloudinary" });
    }

    const newStory = new Story({
      userId: req.body.userId,
      mediaUrl: mediaUrl,
      text: req.body.text || "",
      musicName: req.body.musicName || "",
      musicUrl: req.body.musicUrl || "",
      onlyMessenger: req.body.onlyMessenger || "true"
    });

    const savedStory = await newStory.save();
    res.status(200).json(savedStory);
  } catch (err) {
    console.error("DETAILED_ERROR:", err); // এটি Render লগে এরর দেখাবে
    res.status(500).json({ message: "Server Side Error", error: err.message });
  }
});

export default router;