import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js'; 
import User from '../models/User.js';
import { createPost } from '../controllers/postController.js';

const router = express.Router();

// MULTER CONFIG
const storage = multer.diskStorage({});
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } 
});

/* ==========================================================
    🚀 ROUTES
========================================================== */

// ১. নতুন পোস্ট তৈরি
router.post('/create', auth, upload.single('file'), createPost);

/**
 * ২. প্রোফাইল এবং পোস্ট একসাথে পাওয়া (Neural Fix)
 * এটি আপনার ফ্রন্টএন্ডের 404 এবং ডাটা না পাওয়ার সমস্যা সমাধান করবে।
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.userId);
    
    // ১. প্রথমে ইউজার প্রোফাইল খুঁজে বের করা
    const user = await User.findOne({ auth0Id: targetId }).lean();

    // ২. ওই ইউজারের সব পোস্ট খুঁজে বের করা
    const posts = await Post.find({ 
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { author: targetId },
        { user: targetId } 
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log(`[Neural Link]: Found ${posts.length} signals for Identity: ${targetId}`);
    
    // ৩. অবজেক্ট আকারে ইউজার এবং পোস্ট দুটোই পাঠানো (ফ্রন্টএন্ডের সাথে মিল রেখে)
    res.json({
      user: user || { auth0Id: targetId, name: "Unknown Drifter" },
      posts: posts || []
    });

  } catch (err) {
    console.error("Neural Fetch Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Neural Link Error: Could not synchronize signals." 
    });
  }
});

/**
 * ৩. সার্চ ফাংশনালিটি (সার্চ পেজের জন্য)
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { auth0Id: query }
      ]
    }).limit(10).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search Error" });
  }
});

export default router;