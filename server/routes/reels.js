import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Post from "../models/Post.js"; 
import User from "../models/User.js"; // ইউজার ডাটা চেক করার জন্য

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
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    // Auth0 ID রিকোয়েস্ট থেকে নেওয়া (server.js এ checkJwt এটি সেট করে)
    const myId = req.auth?.payload?.sub;
    const { caption } = req.body;

    if (!myId) return res.status(401).json({ error: "Identity not verified." });
    if (!req.file) return res.status(400).json({ error: "No video file detected." });

    // ইউজারের প্রোফাইল থেকে লেটেস্ট ডাটা নেওয়া
    const userProfile = await User.findOne({ auth0Id: myId }).lean();

    // ২. নতুন রিল তৈরি
    const newReel = new Post({
      author: myId, 
      authorAuth0Id: myId, 
      authorName: userProfile?.name || "Drifter",
      authorAvatar: userProfile?.avatar || "",
      
      text: caption || "",
      media: req.file.path,      // Cloudinary URL
      mediaUrl: req.file.path,   // Backup
      mediaType: "video",        // রিল হিসেবে চেনার জন্য জরুরি
      
      likes: [],
      comments: [],
      views: 0
    });

    const savedReel = await newReel.save();
    console.log(`✅ Reel Synced: ${savedReel._id}`);
    res.status(201).json(savedReel);

  } catch (err) {
    console.error("🔥 REEL_UPLOAD_ERROR:", err.message);
    res.status(500).json({ error: "Neural Breakdown", message: err.message });
  }
});

/* ==========================================================
    📺 GET ALL REELS (GET /api/reels/all)
    আপনার ফ্রন্টএন্ড /all কল করছে, তাই এটি ফিক্স করা হলো
========================================================== */
router.get("/all", async (req, res) => {
  try {
    // শুধুমাত্র ভিডিও টাইপ পোস্টগুলো ফেচ করা হচ্ছে
    const reels = await Post.find({ 
        $or: [
          { mediaType: "video" }, 
          { mediaUrl: { $regex: /\.(mp4|mov|webm|quicktime)$/i } } 
        ] 
    })
    .sort({ createdAt: -1 })
    .lean();
    
    // ফ্রন্টএন্ডের জন্য ডাটা ক্লিনআপ
    const safeReels = reels.map(reel => ({
        ...reel,
        authorName: reel.authorName || "Unknown Drifter",
        likes: reel.likes || [],
        comments: reel.comments || []
    }));

    res.status(200).json(safeReels);
  } catch (err) {
    console.error("🔥 REELS_FETCH_ERROR:", err);
    res.status(500).json({ error: "Failed to fetch reels" });
  }
});

// ফালব্যাক রাউট (যদি কেউ শুধু /api/reels এ হিট করে)
router.get("/", async (req, res) => {
    res.redirect("/api/reels/all");
});

export default router;