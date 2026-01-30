import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Post from "../models/Post.js"; 
import auth from "../middleware/auth.js";

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
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB Limit
});

/* ==========================================================
    🚀 REEL UPLOAD (POST /api/reels/upload)
========================================================== */
// এখানে 'auth' মিডলওয়্যার যোগ করা হয়েছে যাতে রিকোয়েস্টটি সিকিউর থাকে
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    // ফ্রন্টএন্ড থেকে আসা ডেটা (Destructuring)
    const { caption, authorName, authorAvatar, authorAuth0Id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No video file detected. Signal lost." });
    }

    // ২. নতুন পোস্ট তৈরি (ID এবং Name ফ্রন্টএন্ড থেকে সরাসরি নেয়া হচ্ছে)
    const newReel = new Post({
      // আপনার মডেলের ফিল্ড নেম অনুযায়ী এগুলো সেট করুন
      author: authorAuth0Id, // Auth0 থেকে আসা ইউনিক সাব আইডি
      authorAuth0Id: authorAuth0Id, 
      authorId: authorAuth0Id,
      authorName: authorName || "Unknown Drifter",
      authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`,
      
      text: caption || "",
      media: req.file.path,      // Cloudinary URL
      mediaUrl: req.file.path,   // ব্যাকআপ ফিল্ড
      mediaType: "video",        // রিল হিসেবে চেনার জন্য জরুরি
      
      likes: [],
      comments: [],
      views: 0,
      createdAt: new Date()
    });

    const savedReel = await newReel.save();
    
    console.log(`✅ Reel Synced: ${savedReel._id} by ${authorName}`);
    res.status(201).json(savedReel);

  } catch (err) {
    console.error("🔥 REEL_UPLOAD_ERROR:", err);
    res.status(500).json({ 
        error: "Internal Neural Breakdown", 
        message: err.message 
    });
  }
});

/* ==========================================================
    📺 GET ALL REELS (GET /api/reels)
========================================================== */
router.get("/", async (req, res) => {
  try {
    // ভিডিও টাইপ পোস্টগুলো ফিল্টার করা হচ্ছে
    const reels = await Post.find({ 
        $or: [
          { mediaType: "video" }, 
          { mediaUrl: { $regex: /\.(mp4|mov|webm)$/i } } 
        ] 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(reels);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reels" });
  }
});

export default router;