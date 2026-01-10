import express from 'express';
import Post from '../models/Post.js'; 
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// নির্দিষ্ট ইউজারের পোস্ট এবং প্রোফাইল ডাটা পাওয়া
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.userId);
    
    // ১. প্রথমে আইডি দিয়ে ইউজার প্রোফাইল খুঁজে বের করা
    const user = await User.findOne({ auth0Id: targetId }).lean();

    // ২. ওই ইউজারের করা সব পোস্ট খুঁজে বের করা (মাল্টিপল ফিল্ড চেক সহ)
    const posts = await Post.find({ 
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { author: targetId }
      ]
    }).sort({ createdAt: -1 }).lean();

    // রেজাল্ট পাঠানো (ডাটা না থাকলেও খালি অ্যারে [] পাঠাবে যেন ফ্রন্টএন্ড এরর না দেয়)
    res.json({
      user: user || { auth0Id: targetId, name: "Unknown Drifter" },
      posts: posts || []
    });

    console.log(`[Neural Link]: Found ${posts.length} signals for ${targetId}`);
  } catch (err) {
    console.error("Neural Fetch Error:", err);
    res.status(500).json({ msg: "Neural Link Synchronization Error" });
  }
});

export default router;