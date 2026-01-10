import express from 'express';
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js'; // নিশ্চিত করুন cloudinaryStorage এখানে আছে

const router = express.Router();

/* ==========================================================
    1️⃣ UPDATE PROFILE (Optimized for Speed)
========================================================== */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const targetAuth0Id = req.user.sub || req.user.id;

    let updateFields = { name, nickname, bio, location, workplace };

    // ইমেজ চেক এবং পাথ সেট
    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    // অপ্রয়োজনীয় undefined ফিল্ড বাদ দেওয়া
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id }, 
      { $set: updateFields },
      { new: true, upsert: true, lean: true } // lean() ফাস্টার পারফরম্যান্স দেয়
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/* ==========================================================
    2️⃣ NEURAL SEARCH (Scalable Search with Pagination)
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query) return res.json([]);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(`^${query.trim()}`, "i"); // '^' দিয়ে শুরু হওয়া নাম আগে আসবে (Index Friendly)

    const users = await User.find({
      auth0Id: { $ne: req.user.sub || req.user.id },
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
      ]
    })
    .select("name nickname avatar auth0Id location isVerified")
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Search failed" });
  }
});

/* ==========================================================
    3️⃣ GET PROFILE BY ID
========================================================== */
router.get("/profile/:id", auth, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id })
      .select("-__v")
      .lean();
    
    if (!user) return res.status(404).json({ msg: "User not found in orbit" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching neural profile" });
  }
});

/* ==========================================================
    4️⃣ FOLLOW SYSTEM (Atomic & Fast)
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = req.params.targetId;

    if (myId === targetId) return res.status(400).json({ msg: "Self-linking prohibited" });

    // চেক করা হচ্ছে অলরেডি ফলো করা আছে কি না
    const user = await User.findOne({ auth0Id: myId }).select('following').lean();
    const isFollowing = user.following?.includes(targetId);

    if (isFollowing) {
      // Unfollow Logic
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      return res.json({ msg: "Unfollowed", followed: false });
    } else {
      // Follow Logic
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      return res.json({ msg: "Followed", followed: true });
    }
  } catch (err) {
    res.status(500).json({ msg: "Follow operation failed" });
  }
});

/* ==========================================================
    5️⃣ SUGGESTED USERS / DISCOVERY
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
    const { page = 1, limit = 8 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find({ auth0Id: { $ne: currentUserId } })
      .select("name nickname avatar auth0Id bio isVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Could not fetch drifters" });
  }
});

/* ==========================================================
    6️⃣ FOLLOWING LIST (With Optimized Query)
========================================================== */
router.get("/following-list", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const user = await User.findOne({ auth0Id: myId }).select('following').lean();
    
    if (!user || !user.following.length) return res.json([]);

    const followingUsers = await User.find({ auth0Id: { $in: user.following } })
      .select("name avatar bio auth0Id isVerified")
      .lean();

    res.json(followingUsers);
  } catch (err) {
    res.status(500).json({ msg: "Failed to load following orbit" });
  }
});

export default router;