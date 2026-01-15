import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Post from "../models/Post.js"; 
import auth from "../middleware/auth.js"; // সিকিউরিটির জন্য auth মিডলওয়্যার যোগ করা ভালো

const router = express.Router();

// ১. ক্লাউডিনারি স্টোরেজ কনফিগারেশন
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "onyx_reels",
    resource_type: "video", 
    allowed_formats: ["mp4", "mov", "webm", "quicktime"],
  },
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // সর্বোচ্চ ১০০ এমবি পর্যন্ত ভিডিও সাপোর্ট
});

/* ==========================================================
    🚀 REEL UPLOAD (POST /api/reels/upload)
========================================================== */
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { caption, userId, authorName, authorAvatar } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No video file detected. Signal lost." });
    }

    // ২. নতুন পোস্ট অবজেক্ট (আপনার Post মডেলের সাথে মিলিয়ে)
    const newReel = new Post({
      author: userId, // আপনার মডেল অনুযায়ী 'author' বা 'authorId'
      authorId: userId,
      authorName: authorName || "Drifter",
      authorAvatar: authorAvatar || "",
      text: caption || "",
      media: req.file.path, 
      mediaUrl: req.file.path, 
      mediaType: "video", // ফ্রন্টএন্ড ফিল্টারিংয়ের জন্য জরুরি
      likes: [],
      comments: []
    });

    const savedReel = await newReel.save();
    res.status(201).json(savedReel);
  } catch (err) {
    console.error("🔥 REEL_UPLOAD_ERROR:", err);
    res.status(500).json({ error: "Internal Neural Breakdown", details: err.message });
  }
});

/* ==========================================================
    📺 GET ALL REELS (GET /api/reels)
    যাতে রিলস ফিড লোড হতে পারে
========================================================== */
router.get("/", async (req, res) => {
  try {
    const reels = await Post.find({ mediaType: "video" }).sort({ createdAt: -1 });
    res.status(200).json(reels);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reels" });
  }
});

export default router;