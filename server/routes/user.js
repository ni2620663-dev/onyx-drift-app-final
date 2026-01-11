import express from 'express';
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js';

const router = express.Router();

/* ==========================================================
    1️⃣ GET PROFILE BY ID (With Auto-Sync to fix 404 Error)
========================================================== */
router.get("/profile/:id", auth, async (req, res) => {
  try {
    // ফ্রন্টএন্ড থেকে আসা google-oauth2%7C... কে ডিকোড করা হচ্ছে
    const targetId = decodeURIComponent(req.params.id);
    
    // ডাটাবেসে ইউজার খুঁজুন
    let user = await User.findOne({ auth0Id: targetId })
      .select("-__v")
      .lean();
    
    // ✅ ফিক্স: যদি ইউজার খুঁজে না পাওয়া যায় (নতুন ইউজার হলে)
    if (!user) {
      // যদি রিকোয়েস্ট করা আইডিটি লগইন করা ইউজারের নিজের হয়, তবে একটি বেসিক প্রোফাইল তৈরি করুন
      if (targetId === req.user.sub) {
        const newUser = new User({
          auth0Id: req.user.sub,
          name: req.user.name || "Drifter",
          nickname: req.user.nickname || "drifter",
          avatar: req.user.picture || "",
          isVerified: false
        });
        user = await newUser.save();
        console.log("🆕 New Neural Identity Synced:", targetId);
      } else {
        return res.status(404).json({ msg: "Neural profile not found in drift" });
      }
    }
    
    res.json(user);
  } catch (err) {
    console.error("📡 Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    2️⃣ UPDATE PROFILE (Identity Synchronization)
========================================================== */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const targetAuth0Id = req.user.sub || req.user.id;

    let updateFields = { name, nickname, bio, location, workplace };

    // ফাইল হ্যান্ডলিং
    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    // অপ্রয়োজনীয় undefined বা খালি ফিল্ড বাদ দেওয়া
    Object.keys(updateFields).forEach(key => 
      (updateFields[key] === undefined || updateFields[key] === "") && delete updateFields[key]
    );

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id }, 
      { $set: updateFields },
      { new: true, upsert: true, lean: true } // Upsert নিশ্চিত করে যে ডাটা না থাকলে তৈরি হবে
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("📡 Profile Update Error:", err);
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/* ==========================================================
    3️⃣ SEARCH DRIFTERS (Neural Scan)
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const currentUserId = req.user.sub || req.user.id;
    const searchRegex = new RegExp(`${query.trim()}`, "i");

    const users = await User.find({
      auth0Id: { $ne: currentUserId }, // নিজেকে সার্চে দেখাবে না
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } },
        { auth0Id: query }
      ]
    })
    .select("name nickname avatar auth0Id bio isVerified")
    .limit(10)
    .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Search signal lost" });
  }
});

/* ==========================================================
    4️⃣ FOLLOW / UNFOLLOW SYSTEM (Link Management)
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub;
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) return res.status(400).json({ msg: "Self-link forbidden" });

    const user = await User.findOne({ auth0Id: myId }).select('following');
    if (!user) return res.status(404).json({ msg: "User not synced" });

    const isFollowing = user.following?.includes(targetId);

    if (isFollowing) {
      // Unfollow logic
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      res.json({ msg: "Link Terminated", followed: false });
    } else {
      // Follow logic
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      res.json({ msg: "Link Established", followed: true });
    }
  } catch (err) {
    console.error("Link Error:", err);
    res.status(500).json({ msg: "Connection failed" });
  }
});

/* ==========================================================
    5️⃣ DISCOVERY (Broadcast All Users)
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user.sub;
    const users = await User.find({ auth0Id: { $ne: currentUserId } })
      .select("name nickname avatar auth0Id bio isVerified")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Discovery signal lost" });
  }
});

export default router;