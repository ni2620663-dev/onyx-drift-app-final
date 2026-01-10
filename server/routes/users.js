import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Cloudinary কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// প্রোফাইল ফটোর জন্য স্টোরেজ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'onyx_drift_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

// --- ১. ইউজার সার্চ রাউট (নিচে নতুন যোগ করা হয়েছে) ---
// এটি /api/user/search?query=... এই লিঙ্কে কাজ করবে
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ msg: "Search query is empty" });

    // Regex ব্যবহার করে নাম, ইমেইল বা আইডি দিয়ে সার্চ করা
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { auth0Id: { $regex: query, $options: 'i' } }
      ]
    }).select('name avatar auth0Id isVerified').limit(10);

    res.json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ msg: 'Search operation failed' });
  }
});

// ২. প্রোফাইল গেট করা
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id });
    if (!user) return res.status(404).json({ msg: 'Identity not found' });
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ৩. সকল ইউজারের লিস্ট
router.get('/all', auth, async (req, res) => {
  try {
    const users = await User.find().select('name avatar auth0Id isVerified');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch users' });
  }
});

// ৪. প্রোফাইল আপডেট
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, nickname, bio, location, workplace, email } = req.body;
    
    const finalName = name || nickname;
    if (!finalName) {
        return res.status(400).json({ msg: 'Name or Nickname is required' });
    }

    let updateFields = { 
      name: finalName, 
      bio: bio || "", 
      location: location || "", 
      workplace: workplace || "" 
    };

    if (email) updateFields.email = email;

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: req.user.id },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("Update Error:", err);
    if (err.code === 11000) return res.status(400).json({ msg: 'Email already exists' });
    res.status(500).json({ msg: 'Update Failed', error: err.message });
  }
});

// ৫. ফ্রেন্ড রিকোয়েস্ট পাঠানো
router.post('/friend-request/:targetUserId', auth, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { targetUserId } = req.params;

        if (senderId === targetUserId) return res.status(400).json({ msg: "Cannot add yourself" });

        await User.findOneAndUpdate(
            { auth0Id: targetUserId },
            { $addToSet: { friendRequests: senderId } }
        );

        res.json({ msg: "Friend request sent!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৬. ফ্রেন্ড রিকোয়েস্ট এক্সেপ্ট করা
router.post('/friend-accept/:senderId', auth, async (req, res) => {
    try {
        const receiverId = req.user.id;
        const senderId = req.params.senderId;

        const updateReceiver = User.findOneAndUpdate(
            { auth0Id: receiverId },
            { 
                $pull: { friendRequests: senderId },
                $addToSet: { friends: senderId }
            },
            { new: true }
        );

        const updateSender = User.findOneAndUpdate(
            { auth0Id: senderId },
            { $addToSet: { friends: receiverId } }
        );

        await Promise.all([updateReceiver, updateSender]);

        res.json({ msg: "You are now friends!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;