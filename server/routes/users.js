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

// --- ১. ইউজার সার্চ এবং ডিসকভারি রাউট ---
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    let users;

    if (!query || query.trim() === "") {
      // যদি সার্চ খালি থাকে, তবে নিজের আইডি বাদে বাকি ১০ জন ইউজারকে দেখাবে (Discovery Mode)
      users = await User.find({ auth0Id: { $ne: req.user.id } })
        .select('name avatar auth0Id isVerified bio')
        .limit(12);
    } else {
      // Regex সার্চ (নাম বা ইমেইল দিয়ে)
      users = await User.find({
        $and: [
          { auth0Id: { $ne: req.user.id } }, // নিজেকে সার্চে দেখাবে না
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
              { auth0Id: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      }).select('name avatar auth0Id isVerified bio').limit(10);
    }

    res.json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ msg: 'Search operation failed' });
  }
});

// --- ২. ফলো/আনফলো সিস্টেম (FIXED 404 ERROR) ---
router.post('/follow/:targetId', auth, async (req, res) => {
  try {
    const currentUserAuthId = req.user.id;
    const { targetId } = req.params;

    if (currentUserAuthId === targetId) {
      return res.status(400).json({ msg: "Cannot follow yourself" });
    }

    const targetUser = await User.findOne({ auth0Id: targetId });
    const currentUser = await User.findOne({ auth0Id: currentUserAuthId });

    if (!targetUser || !currentUser) return res.status(404).json({ msg: "User not found" });

    // যদি অলরেডি ফলো করা থাকে তবে আনফলো হবে
    if (currentUser.following.includes(targetId)) {
      await User.findOneAndUpdate({ auth0Id: currentUserAuthId }, { $pull: { following: targetId } });
      await User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: currentUserAuthId } });
      return res.json({ msg: "Unfollowed", isFollowing: false });
    } else {
      // ফলো করা না থাকলে ফলো হবে
      await User.findOneAndUpdate({ auth0Id: currentUserAuthId }, { $addToSet: { following: targetId } });
      await User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: currentUserAuthId } });
      return res.json({ msg: "Followed", isFollowing: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৩. প্রোফাইল গেট করা
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id });
    if (!user) return res.status(404).json({ msg: 'Identity not found' });
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ৪. সকল ইউজারের লিস্ট
router.get('/all', auth, async (req, res) => {
  try {
    const users = await User.find().select('name avatar auth0Id isVerified');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch users' });
  }
});

// ৫. প্রোফাইল আপডেট
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, nickname, bio, location, workplace, email } = req.body;
    const finalName = name || nickname;

    if (!finalName) return res.status(400).json({ msg: 'Name is required' });

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
    res.status(500).json({ msg: 'Update Failed', error: err.message });
  }
});

// ৬. ফ্রেন্ড সিস্টেম (Atomic Updates)
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

router.post('/friend-accept/:senderId', auth, async (req, res) => {
  try {
    const receiverId = req.user.id;
    const senderId = req.params.senderId;

    const updateReceiver = User.findOneAndUpdate(
      { auth0Id: receiverId },
      { $pull: { friendRequests: senderId }, $addToSet: { friends: senderId } },
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