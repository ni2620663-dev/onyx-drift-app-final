import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// --- ১. Cloudinary কনফিগারেশন (একই আছে) ---
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

// --- ২. ইউজার সার্চ এবং ডিসকভারি রাউট (FIXED) ---
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query; // ফ্রন্টএন্ড থেকে ?query=... আসবে
    let users;

    // যদি সার্চ কোয়েরি না থাকে, ডিফল্ট ডিসকভারি মোড
    if (!query || query.trim() === "") {
      users = await User.find({ auth0Id: { $ne: req.user.id } })
        .select('name avatar auth0Id isVerified bio followers following nickname')
        .limit(12);
    } else {
      // Regex সার্চ - স্পেশাল ক্যারেক্টার হ্যান্ডেল করার জন্য 'escape' করা ভালো
      const searchRegex = new RegExp(query.trim(), 'i'); 
      
      users = await User.find({
        $and: [
          { auth0Id: { $ne: req.user.id } }, // নিজেকে সার্চ রেজাল্টে দেখাবে না
          {
            $or: [
              { name: searchRegex },
              { nickname: searchRegex },
              { email: searchRegex }
            ]
          }
        ]
      })
      .select('name avatar auth0Id isVerified bio followers following nickname')
      .limit(20);
    }

    res.json(users);
  } catch (err) {
    console.error("❌ Search Error Details:", err.message);
    res.status(500).json({ msg: 'Search failed', error: err.message });
  }
});

// --- ৩. ফলো/আনফলো সিস্টেম (Fixed) ---
router.post('/follow/:targetId', auth, async (req, res) => {
  try {
    const myId = req.user.id; 
    const targetId = decodeURIComponent(req.params.targetId); 

    if (myId === targetId) {
      return res.status(400).json({ msg: "Cannot follow yourself" });
    }

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) {
      return res.status(404).json({ msg: "Target user not found" });
    }

    // অলরেডি ফলো করা আছে কি না চেক
    const isFollowing = targetUser.followers.includes(myId);

    if (isFollowing) {
      // আনফলো লজিক
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      return res.json({ msg: "Unfollowed", followed: false });
    } else {
      // ফলো লজিক - $addToSet ডুপ্লিকেট রোধ করে
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      return res.json({ msg: "Followed", followed: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Follow action failed" });
  }
});

// --- প্রোফাইল এবং অন্যান্য রাউট (বাকি অংশ একই থাকবে) ---
// ... (আপনার আগের কোড)

export default router;