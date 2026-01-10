import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// --- ১. Cloudinary কনফিগারেশন ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'onyx_drift_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

// --- ২. ইউজার সার্চ এবং ডিসকভারি রাউট (Infinite Scroll Support) ---
router.get('/search', auth, async (req, res) => {
  try {
    const { query, page = 1, limit = 12 } = req.query; 
    const currentUserId = req.user.id;
    
    // pagination লজিক
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let users;

    // ১. যদি সার্চ কোয়েরি না থাকে (Discovery Mode)
    if (!query || query.trim() === "") {
      users = await User.find({ auth0Id: { $ne: currentUserId } })
        .select('name avatar auth0Id isVerified bio followers nickname')
        .sort({ createdAt: -1 }) // নতুনদের আগে দেখাবে
        .skip(skip)
        .limit(parseInt(limit))
        .lean(); 
    } 
    // ২. যদি সার্চ কোয়েরি থাকে
    else {
      // Regex: শুরু থেকে খুঁজবে (Indexing friendly)
      const searchRegex = new RegExp(`^${query.trim()}`, 'i'); 
      
      users = await User.find({
        auth0Id: { $ne: currentUserId },
        $or: [
          { name: { $regex: searchRegex } },
          { nickname: { $regex: searchRegex } }
        ]
      })
      .select('name avatar auth0Id isVerified bio followers nickname')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    }

    res.json(users);
  } catch (err) {
    console.error("❌ Search Error:", err.message);
    res.status(500).json({ msg: 'Neural Grid Search Failed' });
  }
});

// --- ৩. ফলো/আনফলো সিস্টেম (High Efficiency) ---
router.post('/follow/:targetId', auth, async (req, res) => {
  try {
    const myId = req.user.id; 
    const targetId = decodeURIComponent(req.params.targetId); 

    if (myId === targetId) {
      return res.status(400).json({ msg: "Neural link with self is impossible" });
    }

    // সরাসরি $addToSet এবং $pull ব্যবহার (Atomic Operation)
    const targetUser = await User.findOne({ auth0Id: targetId }).select('followers').lean();
    if (!targetUser) return res.status(404).json({ msg: "Identity not found" });

    const isFollowing = targetUser.followers.includes(myId);

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      return res.json({ msg: "Unfollowed", followed: false });
    } else {
      // Follow
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      return res.json({ msg: "Followed", followed: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Link synchronization failed" });
  }
});

// --- ৪. প্রোফাইল আপডেট ---
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, nickname, bio, location, workplace } = req.body;
    
    let updateFields = { 
      name, 
      nickname: nickname || name?.toLowerCase().replace(/\s/g, ''), 
      bio, 
      location, 
      workplace 
    };

    if (req.files?.avatar) updateFields.avatar = req.files.avatar[0].path;
    if (req.files?.cover) updateFields.coverImg = req.files.cover[0].path;

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: req.user.id },
      { $set: updateFields },
      { new: true, lean: true }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: 'Update Failed' });
  }
});

export default router;