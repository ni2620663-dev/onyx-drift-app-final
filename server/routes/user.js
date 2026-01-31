import express from 'express';
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js';

const router = express.Router();

/* ==========================================================
    1️⃣ GET PROFILE BY ID & IDENTITY SYNC
    (লগইন করার সাথে সাথে আইডি ও নাম ডাটাবেসে সেভ করবে)
========================================================== */
router.get(['/:id', '/profile/:id'], auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const myId = req.user.sub || req.user.id;
    
    // ডাটাবেসে ইউজার খোঁজা
    let user = await User.findOne({ auth0Id: targetId }).select("-__v").lean();
    
    // যদি ইউজার ডাটাবেসে না থাকে এবং এটি বর্তমান ইউজার হয়, তবে নতুন তৈরি করবে
    if (!user && targetId === myId) {
      console.log("🆕 Syncing identity for new user:", targetId);
      const newUser = new User({
        auth0Id: myId,
        name: req.user.name || req.user.nickname || "Drifter",
        nickname: req.user.nickname || "drifter",
        avatar: req.user.picture || "",
        isVerified: false,
        followers: [],
        following: []
      });
      const savedUser = await newUser.save();
      user = savedUser.toObject();
    }
    
    if (!user) {
      return res.status(404).json({ msg: "Drifter not found in neural network" });
    }
    
    res.json(user);
  } catch (err) {
    console.error("📡 Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    2️⃣ UPDATE PROFILE (নাম চেঞ্জ করলে সাথে সাথে আপডেট হবে)
========================================================== */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const targetAuth0Id = req.user.sub || req.user.id;

    let updateFields = { name, nickname, bio, location, workplace };

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    // ফাকা ডাটা ফিল্টার করা
    Object.keys(updateFields).forEach(key => 
      (updateFields[key] === undefined || updateFields[key] === "") && delete updateFields[key]
    );

    // upsert: true ব্যবহার করা হয়েছে যেন ইউজার না থাকলে তৈরি হয়, থাকলে আপডেট হয়
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id }, 
      { $set: updateFields },
      { new: true, upsert: true, lean: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("📡 Profile Update Error:", err);
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/* ==========================================================
    3️⃣ UPDATE PHOTO
========================================================== */
router.post("/update-photo", auth, upload.single('image'), async (req, res) => {
  try {
    const { type } = req.body; 
    const targetAuth0Id = req.user.sub || req.user.id;
    
    if (!req.file) return res.status(400).json({ msg: "No image provided" });

    let updateFields = {};
    if (type === 'profile') {
      updateFields.avatar = req.file.path;
    } else if (type === 'cover') {
      updateFields.coverImg = req.file.path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id },
      { $set: updateFields },
      { new: true, lean: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("📡 Photo Sync Error:", err);
    res.status(500).json({ msg: "Neural Sync Failed" });
  }
});

/* ==========================================================
    4️⃣ SEARCH DRIFTERS (Fixed for 500 Error)
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    // ফ্রন্টএন্ড থেকে 'q' অথবা 'query' যেকোনোটি আসলে রিসিভ করবে
    const searchQuery = req.query.q || req.query.query; 
    const currentUserId = req.user.sub || req.user.id;

    // যদি সার্চ বক্সে কিছু না থাকে, তবে কিছু সাজেস্টেড ইউজার দেখাবে
    if (!searchQuery || searchQuery.trim() === "") {
      const suggested = await User.find({ auth0Id: { $ne: currentUserId } })
        .select("name nickname avatar auth0Id bio isVerified")
        .limit(10)
        .lean();
      return res.json(suggested);
    }

    const searchRegex = new RegExp(searchQuery.trim(), "i");

    const users = await User.find({
      auth0Id: { $ne: currentUserId },
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
      ]
    })
    .select("name nickname avatar auth0Id bio isVerified")
    .limit(20)
    .lean();

    res.json(users);
  } catch (err) {
    console.error("🔍 Search Error:", err);
    res.status(500).json({ msg: "Neural link interrupted", error: err.message });
  }
});
/* ==========================================================
    5️⃣ FOLLOW / UNFOLLOW SYSTEM
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) return res.status(400).json({ msg: "Self-link forbidden" });

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) {
      return res.status(404).json({ msg: 'Target drifter not found in neural core' });
    }

    const isFollowing = targetUser.followers ? targetUser.followers.includes(myId) : false;

    if (isFollowing) {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      return res.json({ followed: false });
    } else {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      return res.json({ followed: true });
    }
  } catch (err) {
    console.error("📡 Neural Link Follow Error:", err);
    res.status(500).json({ msg: "Connection failed" });
  }
});
/* ==========================================================
    🔄 EXPLICIT SYNC ROUTE (ফ্রন্টএন্ডের axios.post এর জন্য)
========================================================== */
router.post('/sync', auth, async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    
    const user = await User.findOneAndUpdate(
      { auth0Id: auth0Id }, 
      { 
        $set: { 
          name: name,
          email: email,
          avatar: picture,
          nickname: username?.replace(/\s+/g, '').toLowerCase()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } 
    );

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Sync failed" });
  }
});

/* ==========================================================
    6️⃣ DISCOVERY
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
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