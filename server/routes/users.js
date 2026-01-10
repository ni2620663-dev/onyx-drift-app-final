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

// --- ২. ইউজার সার্চ এবং ডিসকভারি রাউট (ID Based) ---
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    let users;

    // যদি সার্চ কোয়েরি না থাকে, ডিফল্ট ডিসকভারি মোড (অন্যান্য ইউজারদের সাজেস্ট করবে)
    if (!query || query.trim() === "") {
      users = await User.find({ auth0Id: { $ne: req.user.id } })
        .select('name avatar auth0Id isVerified bio followers following')
        .limit(12);
    } else {
      // Regex সার্চ (নাম, ইমেইল বা আইডি দিয়ে)
      users = await User.find({
        $and: [
          { auth0Id: { $ne: req.user.id } },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
              { auth0Id: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      }).select('name avatar auth0Id isVerified bio followers following').limit(15);
    }

    res.json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ msg: 'Search failed' });
  }
});

// --- ৩. ফলো/আনফলো সিস্টেম (Twitter-Style Atomic Updates) ---
router.post('/follow/:targetId', auth, async (req, res) => {
  try {
    const myId = req.user.id; // current user
    const { targetId } = req.params; // target user

    if (myId === targetId) return res.status(400).json({ msg: "Cannot follow yourself" });

    const currentUser = await User.findOne({ auth0Id: myId });
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    const isFollowing = currentUser.following.includes(targetId);

    if (isFollowing) {
      // আনফলো লজিক ($pull) - Parallel Execution
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      return res.json({ msg: "Unfollowed", followed: false });
    } else {
      // ফলো লজিক ($addToSet) - Atomic & Parallel
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      return res.json({ msg: "Followed", followed: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Action failed" });
  }
});

// --- ৪. প্রোফাইল ম্যানেজমেন্ট ---
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id })
      .select('-password'); // পাসওয়ার্ড থাকলে বাদ দিবে
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

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
    if (req.files?.avatar) updateFields.avatar = req.files.avatar[0].path;
    if (req.files?.cover) updateFields.coverImg = req.files.cover[0].path;

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

// --- ৫. ফ্রেন্ড সিস্টেম (Legacy Request System) ---
router.post('/friend-request/:targetUserId', auth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { targetUserId } = req.params;
    if (senderId === targetUserId) return res.status(400).json({ msg: "Invalid action" });

    await User.findOneAndUpdate(
      { auth0Id: targetUserId },
      { $addToSet: { friendRequests: senderId } }
    );
    res.json({ msg: "Request sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/friend-accept/:senderId', auth, async (req, res) => {
  try {
    const receiverId = req.user.id;
    const senderId = req.params.senderId;

    await Promise.all([
      User.findOneAndUpdate(
        { auth0Id: receiverId },
        { $pull: { friendRequests: senderId }, $addToSet: { friends: senderId } }
      ),
      User.findOneAndUpdate(
        { auth0Id: senderId },
        { $addToSet: { friends: receiverId } }
      )
    ]);

    res.json({ msg: "Success! You are now friends." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;