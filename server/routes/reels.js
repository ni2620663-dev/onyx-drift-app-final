import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Post from "../models/Post.js"; 
import User from "../models/User.js";
import { auth } from 'express-oauth2-jwt-bearer';

const router = express.Router();

// Auth0 Middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com',
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`,
  tokenSigningAlg: 'RS256'
});

// ক্লাউডিনারি স্টোরেজ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "onyx_reels",
    resource_type: "video", 
    allowed_formats: ["mp4", "mov", "webm", "quicktime"],
  },
});

const upload = multer({ storage: storage });

/* ==========================================================
    📺 GET ALL REELS - ফিক্সড এরর হ্যান্ডলিং
========================================================== */
router.get("/all", async (req, res) => {
  try {
    // ফ্রন্টএন্ডে অনেক সময় ফিল্টার ঠিকমতো না থাকলে 400 আসে, তাই এখানে ডিফল্ট কোয়েরি রাখা হয়েছে
    const reels = await Post.find({ 
        $or: [
          { postType: "reels" },
          { mediaType: "video" }
        ] 
    })
    .sort({ createdAt: -1 })
    .limit(20) // লোডিং স্পিড বাড়ানোর জন্য
    .lean();
    
    // ডাটা না থাকলে এম্পটি অ্যারে পাঠানো (যাতে ফ্রন্টএন্ড ক্রাশ না করে)
    if (!reels) return res.status(200).json([]);

    const safeReels = reels.map(reel => ({
        ...reel,
        likes: Array.isArray(reel.likes) ? reel.likes : [],
        comments: Array.isArray(reel.comments) ? reel.comments : [],
        authorName: reel.authorName || "Unknown Drifter"
    }));

    res.status(200).json(safeReels);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch reels" });
  }
});

/* ==========================================================
    🚀 REEL UPLOAD - ফিক্সড
========================================================== */
router.post("/upload", checkJwt, upload.single("video"), async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub;
    if (!req.file) return res.status(400).json({ error: "ভিডিও ফাইল পাওয়া যায়নি।" });

    const userProfile = await User.findOne({ auth0Id: myId });

    const newReel = new Post({
      author: myId,
      authorAuth0Id: myId,
      authorName: userProfile?.name || "Drifter",
      authorAvatar: userProfile?.avatar || "",
      text: req.body.caption || "",
      media: req.file.path,
      mediaType: "video",
      postType: "reels",
      likes: [],
      comments: []
    });

    await newReel.save();
    res.status(201).json(newReel);
  } catch (err) {
    res.status(400).json({ error: "Upload failed", details: err.message });
  }
});

export default router;