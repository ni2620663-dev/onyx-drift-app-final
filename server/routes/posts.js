import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import { processNeuralIdentity } from "../controllers/aiController.js";
import { processNeuralInput } from "../controllers/aiPostController.js"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import { auth } from 'express-oauth2-jwt-bearer'; // ✅ Auth middleware import kora hoyeche

dotenv.config();
const router = express.Router();

// Auth0 Middleware Configuration
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com',
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`,
  tokenSigningAlg: 'RS256'
});

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
    🧠 0. NEURAL FEED (Fixed)
========================================================== */
router.get("/neural-feed", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (!posts) return res.status(200).json([]);

    const optimizedPosts = posts.map(post => ({
      ...post,
      resonanceScore: (post.likes?.length || 0) * 2 + (post.comments?.length || 0) * 5,
      neuralSync: true,
      authorName: post.authorName || "Unknown Drifter",
      authorAvatar: post.authorAvatar || `https://ui-avatars.com/api/?name=D&background=random`
    }));

    res.json(optimizedPosts);
  } catch (err) {
    console.error("Neural Feed Fetch Error:", err);
    res.status(500).json({ msg: "Neural Grid Offline", error: err.message });
  }
});

/* ==========================================================
    🤖 AI ANALYZE
========================================================== */
router.post("/ai-analyze", async (req, res) => {
  const { text, authorName } = req.body;
  if (!text) return res.status(400).json({ analysis: "Neural input empty." });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this cyberpunk post by "${authorName || 'Drifter'}": "${text}". Max 20 words, witty.`;
    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (error) {
    res.status(500).json({ analysis: "Connection lost." });
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
    🚀 2. CREATE POST (Manual) - Protected with checkJwt
========================================================== */
router.post("/", checkJwt, upload.single("media"), async (req, res) => {
  try {
    const currentUserId = req.auth?.payload?.sub;
    
    if (!currentUserId) {
      return res.status(401).json({ msg: "Identity not verified." });
    }

    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    let mediaUrl = req.file ? req.file.path : "";
    let detectedType = "text";

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video");
      detectedType = isVideo ? "video" : "image";
    }

    const postData = {
      author: currentUserId,
      authorAuth0Id: currentUserId,
      authorName: userProfile?.name || "Drifter",
      authorAvatar: userProfile?.avatar || "",
      text: req.body.text || "",
      media: mediaUrl, 
      mediaType: detectedType,
      likes: [],
      comments: [],
      rankClicks: [], 
    };

    const post = await Post.create(postData);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ msg: "Internal Neural Breakdown", error: err.message });
  }
});

/* ==========================================================
    ❤️ 3. LIKE SYSTEM - Protected
========================================================== */
router.post("/:id/like", checkJwt, async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post missing." });

    const isLiked = post.likes.includes(userId);
    const update = isLiked 
      ? { $pull: { likes: userId } } 
      : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: "Sync error." });
  }
});

/* ==========================================================
    💬 5. ADD COMMENT - Protected
========================================================== */
router.post("/:id/comment", checkJwt, async (req, res) => {
    try {
      const { text } = req.body;
      const userId = req.auth?.payload?.sub;
      const userProfile = await User.findOne({ auth0Id: userId }).lean();
  
      const comment = {
        text,
        userId: userId,
        userName: userProfile?.name || "Drifter",
        userAvatar: userProfile?.avatar || "",
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
router.delete("/:id", checkJwt, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.auth?.payload?.sub;
    
    if (post.authorAuth0Id !== userId) {
      return res.status(401).json({ msg: "Access Denied." });
    }

    await post.deleteOne();
    res.json({ msg: "Post terminated", postId: req.params.id });
  } catch (err) {
    res.status(500).json({ msg: "Deletion failed" });
  }
});

/* ==========================================================
    ✅ 7. USER SPECIFIC POSTS
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