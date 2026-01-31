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
 * ১. ইউজার ডাটা সিঙ্ক (এটিই ডাটাবেসে ইউজার সেভ করবে)
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    
    // ডাটাবেসে ইউজার না থাকলে তৈরি করবে, থাকলে আপডেট করবে (upsert)
    const user = await User.findOneAndUpdate(
      { auth0Id: auth0Id }, 
      { 
        $set: { 
          name: name,
          email: email,
          avatar: picture,
          nickname: username?.replace(/\s+/g, '').toLowerCase() || `drifter_${Math.floor(Math.random() * 1000)}`
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } 
    );

    console.log(`✅ Neural Sync: ${user.name} is now in Database.`);
    res.status(200).json(user);
  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ message: "Identity sync failed" });
  }
});

/**
 * ২. ড্রিপ্টার সার্চ
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") return res.json([]);

    const currentUserId = req.user.sub || req.user.id;
    const searchRegex = new RegExp(`${query.trim()}`, "i");

    const users = await User.find({
      auth0Id: { $ne: currentUserId }, // নিজের আইডি বাদে বাকিদের খুঁজবে
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
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
 * ৩. প্রোফাইল আপডেট
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
    if (nickname) updateFields.nickname = nickname.replace(/\s+/g, '').toLowerCase();
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
 * ৪. প্রোফাইল এবং পোস্ট একসাথে পাওয়া
 */
router.get(['/profile/:userId', '/:userId'], auth, async (req, res, next) => {
  try {
    const rawUserId = req.params.userId;
    if (!rawUserId || ['search', 'all', 'undefined'].includes(rawUserId)) {
        return next();
    }

    const targetId = decodeURIComponent(rawUserId);

    const user = await User.findOne({ auth0Id: targetId }).lean();
    
    const posts = await Post.find({ 
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { userId: targetId }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      user: user || { auth0Id: targetId, name: "Unknown Drifter", avatar: "", bio: "Neural profile not found." },
      posts: posts || []
    });
  } catch (err) {
    res.status(500).json({ message: "Neural Link Error" });
  }
});

/**
 * ৫. নতুন পোস্ট তৈরি
 */
router.post('/create', auth, upload.single('file'), createPost);

/**
 * ৬. ফলো সিস্টেম
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

    if (!targetUser || !currentUser) return res.status(404).json({ msg: "User connection failed" });

    const isFollowing = currentUser.following && currentUser.following.includes(targetId);

    if (isFollowing) {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      res.json({ followed: false });
    } else {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      res.json({ followed: true });
    }
  } catch (err) {
    res.status(500).json({ msg: "Connection failed" });
  }
});

export default router;