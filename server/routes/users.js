import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'onyx_drift_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage });

/* ==========================================================
    🌍 ১. GET ALL USERS (Discovery)
========================================================== */
router.get('/all', auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const users = await User.find({ auth0Id: { $ne: myId } })
      .select('name avatar auth0Id isVerified bio followers nickname')
      .sort({ createdAt: -1 }).limit(20).lean();
    res.json(users);
  } catch (err) { res.status(500).json({ msg: 'Fetch Failed' }); }
});

/* ==========================================================
    🔍 ২. SEARCH (FIXED: Improved Partial Name Matching)
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const myId = req.user.sub || req.user.id;
    
    console.log("Searching for:", query);

    let filter = { auth0Id: { $ne: myId } };

    if (query && query.trim() !== "") {
      // স্পেশাল ক্যারেক্টার হ্যান্ডেল করার জন্য
      const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(safeQuery, 'i'); 

      filter.$or = [
        { name: { $regex: searchRegex } }, 
        { nickname: { $regex: searchRegex } }
      ];
    } else {
      // কিছু না লিখলে লেটেস্ট ৫ জন ইউজার দেখাবে (টেস্টিং এর জন্য)
      const drifters = await User.find(filter).limit(5).lean();
      return res.json(drifters);
    }

    const users = await User.find(filter)
      .select('name avatar auth0Id isVerified nickname')
      .limit(20).lean();
    
    console.log(`Found ${users.length} Drifters`);
    res.json(users);
  } catch (err) { 
    res.status(500).json({ msg: 'Search Failed' }); 
  }
});========================================================== */
/* ==========================================================
    🤝 ৪. ফলো/আনফলো সিস্টেম
========================================================== */
router.post('/follow/:targetId', auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = decodeURIComponent(req.params.targetId);
    if (myId === targetId) return res.status(400).json({ msg: "Self link impossible" });

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) return res.status(404).json({ msg: "User not found" });

    const isFollowing = targetUser.followers.includes(myId);

    if (isFollowing) {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
    } else {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
    }
    res.json({ followed: !isFollowing });
  } catch (err) { res.status(500).json({ msg: "Link failed" }); }
});

/* ==========================================================
    📝 ৫. প্রোফাইল আপডেট
========================================================== */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { bio, location, workplace } = req.body;
    const myId = req.user.sub || req.user.id;
    let updateFields = { bio, location, workplace };

    if (req.files?.avatar) updateFields.avatar = req.files.avatar[0].path;
    if (req.files?.cover) updateFields.coverImg = req.files.cover[0].path;

    Object.keys(updateFields).forEach(key => 
      (updateFields[key] === undefined || updateFields[key] === "") && delete updateFields[key]
    );

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: myId },
      { $set: updateFields },
      { new: true, lean: true }
    );
    res.json(updatedUser);
  } catch (err) { res.status(500).json({ msg: 'Update Failed' }); }
});

export default router;