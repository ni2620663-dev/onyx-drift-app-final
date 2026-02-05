import express from "express";
import auth from "../middleware/auth.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import { processNeuralIdentity } from "../controllers/aiController.js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ Corrected: import instead of require

dotenv.config();
const router = express.Router();

/* ==========================================================
    ☁️ Cloudinary Configuration
========================================================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ==========================================================
    🤖 AI ANALYZE (Single Reaction)
========================================================== */
router.post("/ai-analyze", async (req, res) => {
  const { text, authorName } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a Cyberpunk AI analyst for the social network "Onyx Drift". 
    Analyze this post by user "${authorName}": "${text}". 
    Give a short (max 20 words), witty, futuristic, and encouraging reaction. 
    Stay in character as a neural bot.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ analysis: response.text() });
  } catch (error) {
    res.status(500).json({ analysis: "Connection to neural core lost." });
  }
});

/* ==========================================================
    📦 Multer & Cloudinary Storage
========================================================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "onyx_drift_posts",
    resource_type: "auto", 
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "webm"],
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } 
});

/* ==========================================================
    🌍 1. GET ALL POSTS
========================================================== */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    
    const safePosts = posts.map(post => ({
      ...post,
      authorName: post.authorName || "Unknown Drifter",
      authorAvatar: post.authorAvatar || "https://ui-avatars.com/api/?name=Drifter",
      likes: post.likes || [],
      comments: post.comments || [],
      rankClicks: post.rankClicks || []
    }));

    res.json(safePosts);
  } catch (err) {
    res.status(500).json({ msg: "Neural Fetch Failure", error: err.message });
  }
});

/* ==========================================================
    📺 1.5. GET ALL REELS
========================================================== */
router.get("/reels/all", async (req, res) => {
  try {
    const reels = await Post.find({ 
      mediaType: { $in: ["video", "reel"] } 
    })
    .sort({ createdAt: -1 })
    .lean();

    const safeReels = (reels || []).map(reel => ({
      ...reel,
      authorName: reel.authorName || "Unknown Drifter",
      authorAvatar: reel.authorAvatar || "https://ui-avatars.com/api/?name=Drifter",
      likes: reel.likes || [],
      rankClicks: reel.rankClicks || []
    }));

    res.json(safeReels);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch neural reels" });
  }
});

/* ==========================================================
    🚀 2. CREATE POST & TRIGGER NEURAL AI
========================================================== */
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No media file detected." });
    }

    const currentUserId = req.user?.sub || req.user?.id;
    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    const isVideo = req.file.mimetype ? req.file.mimetype.includes("video") : false;
    let detectedType = isVideo ? "video" : "image";
    
    if (req.body.isStory === "true" || req.body.type === "story") {
      detectedType = "story";
    } else if ((req.body.isReel === "true" || req.body.type === "reel") && isVideo) {
      detectedType = "reel";
    }

    const postData = {
      author: currentUserId, 
      authorAuth0Id: currentUserId,    
      authorName: userProfile?.name || req.user?.name || "Drifter",
      authorAvatar: userProfile?.avatar || req.user?.picture || "",
      text: req.body.text || "",
      media: req.file.path, 
      mediaUrl: req.file.path, 
      mediaType: detectedType,
      likes: [],
      comments: [],
      rankClicks: [], 
    };

    const post = await Post.create(postData);

    // 🤖 Trigger AI Analysis in background for long-term profile shaping
    if (post.text) {
        processNeuralIdentity(currentUserId, post.text);
    }

    res.status(201).json(post);
  } catch (err) {
    console.error("🔥 UPLOAD_ERROR:", err);
    res.status(500).json({ msg: "Internal Neural Breakdown", error: err.message });
  }
});

/* ==========================================================
    ❤️ 4. LIKE / UNLIKE
========================================================== */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const likesArray = post.likes || [];
    const isLiked = likesArray.includes(userId);
    
    const update = isLiked 
      ? { $pull: { likes: userId } } 
      : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================
    ⚡ 5. RANK UP SYSTEM
========================================================== */
router.post("/:id/rank-up", auth, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const clicks = post.rankClicks || [];

    if (clicks.includes(userId)) {
      return res.status(400).json({ msg: "Neural Pulse already sent!" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { rankClicks: userId } },
      { new: true }
    );

    const clickCount = updatedPost.rankClicks.length;
    let rankIncreased = false;

    if (clickCount > 0 && clickCount % 10 === 0) {
      await User.findOneAndUpdate(
        { auth0Id: updatedPost.authorAuth0Id || updatedPost.author },
        { $inc: { neuralRank: 1 } }
      );
      rankIncreased = true;
    }

    res.json({ 
      success: true, 
      clicks: clickCount, 
      rankUp: rankIncreased,
      msg: rankIncreased ? "Milestone Reached! Creator Rank Increased! ⚡" : "Neural Pulse Synced"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================
    💬 3. ADD COMMENT
========================================================== */
router.post("/:id/comment", auth, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ msg: "Text required" });
  
      const currentUserId = req.user?.sub || req.user?.id;
      const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();
  
      const comment = {
        text,
        userId: currentUserId,
        userName: userProfile?.name || req.user?.name || "Drifter",
        userAvatar: userProfile?.avatar || req.user?.picture || "",
        createdAt: new Date()
      };
  
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: comment } },
        { new: true }
      );
  
      res.json(post);
    } catch (err) {
      res.status(500).json({ msg: "Comment Failure", error: err.message });
    }
  });

/* ==========================================================
    🗑️ 6. DELETE POST
========================================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.sub || req.user.id;
    if (post.authorAuth0Id !== userId && post.author !== userId)
      return res.status(401).json({ msg: "Access Denied" });

    await post.deleteOne();
    res.json({ msg: "Post terminated", postId: req.params.id });
  } catch (err) {
    res.status(500).json({ msg: "Deletion failed" });
  }
});

/* ==========================================================
    ✅ 7. GET POSTS BY USER ID
========================================================== */
router.get("/user/:userId", async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    const userPosts = await Post.find({
      $or: [
        { authorAuth0Id: targetUserId },
        { author: targetUserId }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json(userPosts || []);
  } catch (err) {
    res.status(500).json({ msg: "Neural signal lost" });
  }
});

export default router;