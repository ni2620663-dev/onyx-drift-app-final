import express from 'express';
import Post from '../models/Post.js'; 
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/* ==========================================================
    ১. CONTROLLER FUNCTIONS (এআই ও সিস্টেম কন্ট্রোল)
========================================================== */

// ১. এআই অটো-পাইলট টগল
const toggleAutopilot = async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.aiAutopilot = !user.aiAutopilot;
    await user.save();
    
    res.json({ aiAutopilot: user.aiAutopilot, msg: "Neural Autopilot Updated" });
  } catch (err) {
    res.status(500).json({ msg: "System Sync Failure" });
  }
};

// ২. এআই টোন (Personality) আপডেট
const updateAiTone = async (req, res) => {
  try {
    const { tone } = req.body;
    const user = await User.findOneAndUpdate(
      { auth0Id: req.user.sub },
      { aiTone: tone },
      { new: true }
    );
    res.json({ aiTone: user.aiTone, msg: "Personality Calibrated" });
  } catch (err) {
    res.status(500).json({ msg: "Calibration Failure" });
  }
};

// ৩. ঘোস্ট মোড টগল
const toggleGhostMode = async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.ghostMode = !user.ghostMode;
    await user.save();
    res.json({ ghostMode: user.ghostMode, msg: "Ghost Protocol Updated" });
  } catch (err) {
    res.status(500).json({ msg: "Ghost Protocol Error" });
  }
};

/* ==========================================================
    ২. ROUTES (পাবলিক ও প্রাইভেট গেটওয়ে)
========================================================== */

// --- প্রোফাইল এবং পোস্ট ডাটা পাওয়া ---
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.userId);
    
    // ইউজার এবং পোস্ট প্যারালালি খোঁজা (Performance optimization)
    const [user, posts] = await Promise.all([
      User.findOne({ auth0Id: targetId }).lean(),
      Post.find({ 
        $or: [
          { authorAuth0Id: targetId },
          { authorId: targetId },
          { author: targetId }
        ]
      }).sort({ createdAt: -1 }).lean()
    ]);

    res.json({
      user: user || { auth0Id: targetId, name: "Unknown Drifter", nickname: "drifter_unknown" },
      posts: posts || []
    });

    console.log(`[Neural Link]: Found ${posts.length} signals for ${targetId}`);
  } catch (err) {
    console.error("Neural Fetch Error:", err);
    res.status(500).json({ msg: "Neural Link Synchronization Error" });
  }
});

// --- ✅ ফলো/আনফলো টগল রাউট (স্মার্ট লজিক) ---
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const targetAuth0Id = decodeURIComponent(req.params.id);
    const followerAuth0Id = req.user.sub;

    if (followerAuth0Id === targetAuth0Id) {
      return res.status(400).json({ message: "You cannot link with your own node." });
    }

    const targetUser = await User.findOne({ auth0Id: targetAuth0Id });
    const currentUser = await User.findOne({ auth0Id: followerAuth0Id });

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "Neural node not found in matrix." });
    }

    // অলরেডি ফলো করা থাকলে আনফলো হবে, না থাকলে ফলো হবে
    const isFollowing = currentUser.following.includes(targetAuth0Id);

    if (isFollowing) {
      // আনফলো লজিক
      currentUser.following = currentUser.following.filter(id => id !== targetAuth0Id);
      targetUser.followers = targetUser.followers.filter(id => id !== followerAuth0Id);
      await currentUser.save();
      await targetUser.save();
      return res.status(200).json({ isFollowing: false, message: "Neural link severed (Unfollowed)." });
    } else {
      // ফলো লজিক
      currentUser.following.push(targetAuth0Id);
      targetUser.followers.push(followerAuth0Id);
      await currentUser.save();
      await targetUser.save();
      return res.status(200).json({ isFollowing: true, message: "Neural link established (Following)!" });
    }
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ message: "Neural Connection Failure" });
  }
});

// --- সিস্টেম কন্ট্রোল রাউটস ---
router.post('/autopilot/toggle', auth, toggleAutopilot);
router.put('/tone/update', auth, updateAiTone);
router.post('/ghost/toggle', auth, toggleGhostMode);

export default router;