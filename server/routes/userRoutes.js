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
 * ১. ড্রিপ্টার সার্চ (Search Fix)
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") return res.json([]);

    const currentUserId = req.user.sub || req.user.id;
    const searchRegex = new RegExp(`${query.trim()}`, "i");

    const users = await User.find({
      auth0Id: { $ne: currentUserId },
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } },
        { auth0Id: query }
      ]
    })
    .select("name nickname avatar auth0Id bio isVerified followers following")
    .limit(12)
    .lean();
    
    res.status(200).json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search signal lost" });
  }
});

/**
 * ২. প্রোফাইল আপডেট (Update Fix)
 */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const targetAuth0Id = req.user.sub || req.user.id;
    let updateFields = {};
    
    if (name) updateFields.name = name;
    if (nickname) updateFields.nickname = nickname;
    if (bio) updateFields.bio = bio;
    if (location) updateFields.location = location;
    if (workplace) updateFields.workplace = workplace;

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id }, 
      { $set: updateFields },
      { new: true, upsert: true, lean: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/**
 * ৩. প্রোফাইল এবং পোস্ট একসাথে পাওয়া (Fixes 404 & %7C Error)
 */
router.get(['/profile/:userId', '/:userId'], auth, async (req, res, next) => {
  try {
    const rawUserId = req.params.userId;
    // Reserved keywords এড়ানো
    if (!rawUserId || rawUserId === 'search' || rawUserId === 'all' || rawUserId === 'undefined') {
        return next();
    }

    const targetId = decodeURIComponent(rawUserId);
    console.log(`📡 Neural Sync Request for ID: ${targetId}`);

    // ইউজার খোঁজা
    const user = await User.findOne({ auth0Id: targetId }).lean();
    
    // পোস্ট খোঁজা (সবগুলো সম্ভাব্য ফিল্ড চেক করা হচ্ছে)
    const posts = await Post.find({ 
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { user: targetId },
        { author: targetId },
        { userId: targetId }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      user: user || { auth0Id: targetId, name: "Unknown Drifter", avatar: "", bio: "Neural profile not found." },
      posts: posts || []
    });
  } catch (err) {
    console.error("Fetch Profile Error:", err);
    res.status(500).json({ message: "Neural Link Error" });
  }
});

/**
 * ৪. নতুন পোস্ট তৈরি
 */
router.post('/create', auth, upload.single('file'), createPost);

/**
 * ৫. ফলো সিস্টেম (Error Free Version)
 */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) {
        return res.status(400).json({ msg: "Self-link forbidden" });
    }

    // ১. চেক করা যে টার্গেট ইউজার এবং বর্তমান ইউজার ডাটাবেসে আছে কি না
    const [targetUser, currentUser] = await Promise.all([
        User.findOne({ auth0Id: targetId }),
        User.findOne({ auth0Id: myId })
    ]);

    if (!targetUser) return res.status(404).json({ msg: "Target user not found" });
    if (!currentUser) return res.status(404).json({ msg: "Your profile not found" });

    // ২. চেক করা অলরেডি ফলো করা আছে কি না
    const isFollowing = currentUser.following && currentUser.following.includes(targetId);

    if (isFollowing) {
      // আনফলো লজিক ($pull ব্যবহার করা হয়েছে)
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      res.json({ followed: false, message: "Unfollowed successfully" });
    } else {
      // ফলো লজিক ($addToSet ডুপ্লিকেট এন্ট্রি রোধ করে)
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      res.json({ followed: true, message: "Followed successfully" });
    }
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ msg: "Connection failed" });
  }
});

export default router;