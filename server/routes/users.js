import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// --- ১. ক্লাউডিনারি কনফিগারেশন ---
// আপনার .env ফাইলে এই ভেরিয়েবলগুলো থাকতে হবে
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- ২. মাল্টার স্টোরেজ কনফিগারেশন ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'OnyxDrift_Profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage: storage });

// --- ৩. প্রোফাইল আপডেট রাউট ---
/**
 * @route   PUT /api/user/update-profile
 * @desc    Update user profile text and images (Avatar/Cover)
 * @access  Private
 */
router.put(
  "/update-profile", 
  [auth, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }])], 
  async (req, res) => {
    try {
      // ফ্রন্টএন্ড থেকে আসা টেক্সট ডাটা
      const { nickname, bio, location, workplace } = req.body;
      
      const updateFields = {};
      if (nickname) updateFields.name = nickname;
      if (bio) updateFields.bio = bio;
      if (location) updateFields.location = location;
      if (workplace) updateFields.workplace = workplace;

      // ক্লাউডিনারি থেকে আসা ইমেজের URL চেক করা
      if (req.files) {
        if (req.files['avatar']) {
          updateFields.avatar = req.files['avatar'][0].path;
        }
        if (req.files['cover']) {
          updateFields.coverImg = req.files['cover'][0].path;
        }
      }

      // ডাটাবেস আপডেট
      const updatedUser = await User.findOneAndUpdate(
        { auth0Id: req.user.id }, // Auth0 sub আইডি
        { $set: updateFields },
        { new: true, upsert: true }
      );

      res.json(updatedUser);
    } catch (err) {
      console.error("❌ Profile Sync Error:", err.message);
      res.status(500).json({ msg: 'Neural Sync Failed', error: err.message });
    }
  }
);

// --- ৪. প্রোফাইল ডাটা গেট করা ---
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id });
    if (!user) return res.status(404).json({ msg: 'Identity not found' });
    res.json(user);
  } catch (err) {
    console.error('Fetch Error:', err.message);
    res.status(500).send('Server error');
  }
});

export default router;