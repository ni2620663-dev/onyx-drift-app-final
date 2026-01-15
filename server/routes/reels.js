import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Post from "../models/Post.js"; 

const router = express.Router();

// স্টোরেজ কনফিগারেশন - নিশ্চিত করুন resource_type: "auto" অথবা "video" আছে
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "onyx_reels",
    resource_type: "video", 
    allowed_formats: ["mp4", "mov", "webm", "quicktime"], // quicktime যোগ করা হয়েছে iPhone ভিডিওর জন্য
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { caption, userId, authorName, authorAvatar } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const newReel = new Post({
      authorId: userId,
      authorName: authorName || "Drifter",
      authorAvatar: authorAvatar || "",
      text: caption || "",
      media: req.file.path, // অনেক সময় ফ্রন্টএন্ড 'media' ফিল্ড আশা করে
      mediaUrl: req.file.path, 
      mediaType: "video",
    });

    const savedReel = await newReel.save();
    res.status(201).json(savedReel);
  } catch (err) {
    console.error("Reel Upload Error Detail:", err); // এটি আপনার Render Console-এ এরর দেখাবে
    res.status(500).json({ error: err.message });
  }
});

export default router;