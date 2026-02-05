import express from "express";
import auth from "../middleware/auth.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import { processNeuralIdentity } from "../controllers/aiController.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";

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
    🤖 AI ANALYZE (Quick Reaction)
========================================================== */
router.post("/ai-analyze", async (req, res) => {
  const { text, authorName } = req.body;
  if (!text) return res.status(400).json({ analysis: "Neural input empty." });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a Cyberpunk AI analyst for "Onyx Drift" social network. 
    Analyze this post by "${authorName || 'Drifter'}": "${text}". 
    Short reaction (max 20 words), witty, futuristic. Stay in character.`;

    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (error) {
    console.error("Gemini Error:", error);
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
      authorAvatar: post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || 'D'}`,
      likes: post.likes || [],
      comments: post.comments || [],
      rankClicks: post.rankClicks || []
    }));

    res.json(safePosts);
  } catch (err) {
    res.status(500).json({ msg: "Neural Fetch Failure" });
  }
});

/* ==========================================================
    🚀 2. CREATE POST
========================================================== */
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    if (!req.body.text && !req.file) {
      return res.status(400).json({ msg: "Empty transmission blocked." });
    }

    const currentUserId = req.user?.sub || req.user?.id;
    if (!currentUserId) return res.status(401).json({ msg: "User identification failed." });

    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    let mediaUrl = req.file ? req.file.path : "";
    let detectedType = "text";

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video");
      detectedType = isVideo ? "video" : "image";
      
      if (req.body.type === "story" || req.body.isStory === "true") detectedType = "story";
      else if ((req.body.type === "reel" || req.body.isReel === "true") && isVideo) detectedType = "reel";
    }

    const postData = {
      author: currentUserId,
      authorAuth0Id: currentUserId,
      authorName: userProfile?.name || req.user?.name || "Drifter",
      authorAvatar: userProfile?.avatar || req.user?.picture || "",
      text: req.body.text || "",
      media: mediaUrl, 
      mediaType: detectedType,
      isEncrypted: req.body.isEncrypted === "true",
      likes: [],
      comments: [],
      rankClicks: [], 
    };

    const post = await Post.create(postData);

    if (post.text) {
      processNeuralIdentity(currentUserId, post.text).catch(() => {});
    }

    res.status(201).json(post);
  } catch (err) {
    console.error("UPLOAD_ERROR:", err);
    res.status(500).json({ msg: "Internal Neural Breakdown" });
  }
});

/* ==========================================================
    ❤️ 3. LIKE SYSTEM (Stabilized)
========================================================== */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid Post ID" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post missing." });

    // likes অ্যারে না থাকলে তৈরি করে নিবে (Safety)
    if (!Array.isArray(post.likes)) post.likes = [];

    const isLiked = post.likes.includes(userId);
    const update = isLiked 
      ? { $pull: { likes: userId } } 
      : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: "Sync error in the drift." });
  }
});

/* ==========================================================
    ⚡ 4. RANK UP
========================================================== */
router.post("/:id/rank-up", auth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.rankClicks?.includes(userId)) {
      return res.status(400).json({ msg: "Neural Pulse already sent!" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { rankClicks: userId } },
      { new: true }
    );

    let rankIncreased = false;
    const clickCount = updatedPost.rankClicks?.length || 0;

    if (clickCount > 0 && clickCount % 10 === 0) {
      await User.findOneAndUpdate(
        { auth0Id: updatedPost.authorAuth0Id },
        { $inc: { neuralRank: 1 } }
      );
      rankIncreased = true;
    }

    res.json({ 
      success: true, 
      clicks: clickCount, 
      rankUp: rankIncreased,
      msg: rankIncreased ? "Milestone Reached! Rank Increased! ⚡" : "Pulse Synced"
    });
  } catch (err) {
    res.status(500).json({ error: "Rank sync failure." });
  }
});

/* ==========================================================
    💬 5. ADD COMMENT
========================================================== */
router.post("/:id/comment", auth, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ msg: "Message empty." });
  
      const userId = req.user?.sub || req.user?.id;
      const userProfile = await User.findOne({ auth0Id: userId }).lean();
  
      const comment = {
        text,
        userId: userId,
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
      res.status(500).json({ msg: "Comment Failure" });
    }
});

/* ==========================================================
    🗑️ 6. DELETE POST
========================================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user?.sub || req.user?.id;
    if (post.authorAuth0Id !== userId && post.author !== userId)
      return res.status(401).json({ msg: "Access Denied." });

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
    const targetId = decodeURIComponent(req.params.userId);
    const userPosts = await Post.find({
      $or: [{ authorAuth0Id: targetId }, { author: targetId }]
    }).sort({ createdAt: -1 }).lean();

    res.json(userPosts || []);
  } catch (err) {
    res.status(500).json({ msg: "Neural signal lost" });
  }
});

export default router;