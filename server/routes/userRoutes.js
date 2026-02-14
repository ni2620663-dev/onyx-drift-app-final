import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js'; 
import User from '../models/User.js';
import { createPost } from '../controllers/postController.js';

const router = express.Router();

/* ==========================================================
    ⚙️ MULTER CONFIGURATION
========================================================== */
const storage = multer.diskStorage({});
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } 
});

/* ==========================================================
    🚀 ROUTES
========================================================== */

/**
 * ১. লজড-ইন ইউজারের প্রোফাইল ডাটা পাওয়া
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const auth0Id = req.user.sub || req.user.id;
    const user = await User.findOne({ auth0Id }).lean();
    
    if (!user) {
      return res.status(404).json({ message: "Profile not found." });
    }
    
    const userWithStats = {
        ...user,
        stats: {
            neuralImpact: user.neuralImpact || 0,
            rank: user.neuralRank || "Novice Drifter"
        }
    };

    const posts = await Post.find({ 
      $or: [{ authorId: auth0Id }, { authorAuth0Id: auth0Id }, { author: auth0Id }] 
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({ user: userWithStats, posts });
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ message: "Neural Link Error", error: err.message });
  }
});

/**
 * ২. রিলস ডাটা পাওয়া
 */
router.get('/reels/all', async (req, res) => {
    try {
        const reels = await Post.find({ 
            $or: [{ mediaType: 'reel' }, { mediaType: 'video' }] 
        })
        .sort({ createdAt: -1 })
        .lean();
        
        res.status(200).json(reels || []);
    } catch (err) {
        res.status(400).json({ message: "Failed to fetch reels", error: err.message });
    }
});

/**
 * ৩. ইউজার ডাটা সিঙ্ক
 */
router.get('/sync', auth, async (req, res) => {
  try {
    const auth0Id = req.user.sub || req.user.id;
    const user = await User.findOne({ auth0Id });
    if (!user) return res.status(404).json({ message: "User not synced yet" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Sync fetch failed" });
  }
});

router.post('/sync', auth, async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    
    const user = await User.findOneAndUpdate(
      { auth0Id: auth0Id || req.user.sub }, 
      { 
        $set: { 
          name: name,
          email: email,
          avatar: picture,
          nickname: username?.replace(/\s+/g, '').toLowerCase() || `drifter_${Math.floor(Math.random() * 1000)}`
        },
        $setOnInsert: {
          neuralImpact: 0,
          neuralRank: "Novice Drifter",
          moodStats: { motivated: 50, creative: 30, calm: 20 },
          memoryVaultCount: 0
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } 
    );

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Identity sync failed" });
  }
});

/**
 * ৪. ড্রিপ্টার সার্চ (FIXED FOR 404 & QUERY PARAMS)
 */
router.get('/search', auth, async (req, res) => {
  try {
    // ফ্রন্টএন্ড 'q' অথবা 'query' যেটাই পাঠাক তা হ্যান্ডেল করবে
    const searchQuery = req.query.query || req.query.q;
    
    if (!searchQuery || searchQuery.trim() === "") {
        return res.json([]);
    }

    const currentUserId = req.user.sub || req.user.id;
    const searchRegex = new RegExp(`${searchQuery.trim()}`, "i");

    const users = await User.find({
      auth0Id: { $ne: currentUserId }, 
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
      ]
    })
    .select("name nickname avatar auth0Id bio neuralImpact neuralRank")
    .limit(12)
    .lean();
    
    res.status(200).json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search signal lost" });
  }
});

/**
 * ৫. নির্দিষ্ট ইউজারের প্রোফাইল দেখা
 */
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.userId);
    
    // রিজার্ভড কিউওয়ার্ড ফিল্টারিং
    if (['search', 'all', 'sync', 'reels'].includes(targetId)) {
        return res.status(400).json({ message: "Invalid User ID" });
    }

    const user = await User.findOne({ auth0Id: targetId }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const formattedUser = {
        ...user,
        stats: {
            neuralImpact: user.neuralImpact || 0,
            rank: user.neuralRank || "Drifter"
        }
    };

    const posts = await Post.find({ 
        $or: [{ author: targetId }, { authorAuth0Id: targetId }, { authorId: targetId }] 
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      user: formattedUser,
      posts: posts || []
    });
  } catch (err) {
    res.status(500).json({ message: "Neural Link Error" });
  }
});

/**
 * ৬. পোস্ট তৈরি
 */
router.post('/create', auth, upload.single('file'), createPost);

/**
 * ৭. কেনাকাটা সিস্টেম
 */
router.post("/purchase-item", auth, async (req, res) => {
  try {
    const { itemId, cost, isPointsPayment } = req.body;
    const auth0Id = req.user.sub || req.user.id;

    const user = await User.findOne({ auth0Id });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (isPointsPayment) {
      if (user.neuralImpact < cost) return res.status(400).json({ msg: "Insufficient Points" });

      const updatedUser = await User.findOneAndUpdate(
        { auth0Id },
        { $inc: { neuralImpact: -cost }, $addToSet: { unlockedAssets: itemId } },
        { new: true }
      );
      return res.status(200).json({ success: true, balance: updatedUser.neuralImpact });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Transaction failed" });
  }
});

router.post("/equip-asset", auth, async (req, res) => {
  try {
    const { assetId, category } = req.body;
    const auth0Id = req.user.sub || req.user.id;
    const updateField = {};
    if (category === 'aura') updateField['profileSettings.activeAura'] = assetId;
    if (category === 'badge') updateField['profileSettings.activeBadge'] = assetId;

    await User.findOneAndUpdate({ auth0Id }, { $set: updateField });
    res.status(200).json({ success: true, message: "Profile synchronized." });
  } catch (err) {
    res.status(500).json({ msg: "Neural Link Error" });
  }
});

/**
 * ৮. ফলো সিস্টেম
 */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = decodeURIComponent(req.params.targetId);
    if (myId === targetId) return res.status(400).json({ msg: "Self-link forbidden" });

    const [targetUser, currentUser] = await Promise.all([
        User.findOne({ auth0Id: targetId }),
        User.findOne({ auth0Id: myId })
    ]);

    if (!targetUser || !currentUser) return res.status(404).json({ msg: "User not found" });

    const isFollowing = currentUser.following?.includes(targetId);

    if (isFollowing) {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId }, $inc: { neuralImpact: -5 } })
      ]);
      res.json({ followed: false });
    } else {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId }, $inc: { neuralImpact: 10 } })
      ]);
      res.json({ followed: true });
    }
  } catch (err) {
    res.status(500).json({ msg: "Connection failed" });
  }
});

export default router;