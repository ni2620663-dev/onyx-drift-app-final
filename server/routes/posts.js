import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from 'express-oauth2-jwt-bearer';

dotenv.config();
const router = express.Router();

// --- Auth0 Middleware ---
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com',
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`,
  tokenSigningAlg: 'RS256'
});

// Optional Auth Helper: টোকেন না থাকলেও যেন ফিড ক্রাশ না করে
const optionalAuth = (req, res, next) => {
  checkJwt(req, res, (err) => {
    next(); // এরর আসলেও পরের ধাপে যাবে
  });
};

/* ==========================================================
    ☁️ Cloudinary & Gemini Config
========================================================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ==========================================================
    🧠 0. NEURAL FEED (AI + User Posts Integrated)
========================================================== */
router.get("/neural-feed", optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.auth?.payload?.sub;
    
    // ১. সব পোস্ট ফেচ করা (AI এবং User)
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (!posts || posts.length === 0) return res.status(200).json([]);

    // ২. Resonance Scoring Algorithm
    const optimizedPosts = posts.map(post => {
      let resonanceScore = 0;

      // ক) এনগেজমেন্ট বোনাস
      resonanceScore += (post.likes?.length || 0) * 5;
      resonanceScore += (post.comments?.length || 0) * 10;

      // খ) AI জেনারেটেড পোস্ট বুস্ট
      if (post.isAiGenerated) resonanceScore += 40;

      // গ) অথর ভেরিফাইড কি না
      if (post.authorAuth0Id === currentUserId) resonanceScore += 20;

      return {
        ...post,
        resonanceScore,
        neuralSync: true,
        authorName: post.authorName || "Unknown Drifter",
        authorAvatar: post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || 'D'}&background=random`
      };
    });

    // ৩. স্কোরের ভিত্তিতে শর্টিং
    optimizedPosts.sort((a, b) => b.resonanceScore - a.resonanceScore);

    res.json(optimizedPosts.slice(0, 50));
  } catch (err) {
    console.error("❌ Neural Feed Error:", err);
    res.status(500).json({ msg: "Neural Grid Offline", error: err.message });
  }
});

/* ==========================================================
    🤖 1. AI ANALYZE (Gemini Integration)
========================================================== */
router.post("/ai-analyze", async (req, res) => {
  const { text, authorName } = req.body;
  if (!text) return res.status(400).json({ analysis: "Neural input empty." });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Act as a Cyberpunk AI. Analyze this neural post by "${authorName || 'Drifter'}": "${text}". Give a witty, dark, and futuristic analysis in max 20 words.`;
    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (error) {
    res.status(500).json({ analysis: "AI Node Disconnected." });
  }
});

/* ==========================================================
    📦 2. Multer & Media Storage
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
    🚀 3. CREATE POST (Manual)
========================================================== */
router.post("/", checkJwt, upload.single("media"), async (req, res) => {
  try {
    const currentUserId = req.auth?.payload?.sub;
    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    let mediaUrl = req.file ? req.file.path : "";
    let detectedType = "text";

    if (req.file) {
      detectedType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    const postData = {
      authorAuth0Id: currentUserId,
      authorName: userProfile?.name || "Drifter",
      authorAvatar: userProfile?.picture || userProfile?.avatar || "",
      text: req.body.text || "",
      media: mediaUrl,
      mediaType: detectedType,
      isAiGenerated: false,
      likes: [],
      comments: [],
      createdAt: new Date()
    };

    const post = await Post.create(postData);
    res.status(201).json(post);
  } catch (err) {
    console.error("Post Creation Error:", err);
    res.status(500).json({ msg: "Neural Breakdown during posting." });
  }
});

/* ==========================================================
    ❤️ 4. LIKE/UNLIKE SYSTEM
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
    res.status(500).json({ error: "Sync error in Heart Node." });
  }
});

/* ==========================================================
    💬 5. ADD COMMENT
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
        userAvatar: userProfile?.picture || userProfile?.avatar || "",
        createdAt: new Date()
      };
  
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: comment } },
        { new: true }
      );
  
      res.json(post);
    } catch (err) {
      res.status(500).json({ msg: "Communication Link Failure" });
    }
});

/* ==========================================================
    🗑️ 6. DELETE POST
========================================================== */
router.delete("/:id", checkJwt, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.auth?.payload?.sub;
    
    if (!post) return res.status(404).json({ msg: "Post already purged." });
    if (post.authorAuth0Id !== userId) {
      return res.status(403).json({ msg: "Unauthorized Purge." });
    }

    await post.deleteOne();
    res.json({ msg: "Memory Terminated", postId: req.params.id });
  } catch (err) {
    res.status(500).json({ msg: "Termination failed." });
  }
});

/* ==========================================================
    ✅ 7. USER PROFILE POSTS
========================================================== */
router.get("/user/:userId", async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.userId);
    const userPosts = await Post.find({ authorAuth0Id: targetId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(userPosts || []);
  } catch (err) {
    res.status(500).json({ msg: "Neural signal lost." });
  }
});

export default router;