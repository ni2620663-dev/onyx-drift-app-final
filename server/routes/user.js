import express from 'express';
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js';

const router = express.Router();

/* ==========================================================
    1️⃣ GET PROFILE BY ID & IDENTITY SYNC
========================================================== */
router.get(['/:id', '/profile/:id'], auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const myId = req.user.sub || req.user.id;
    
    // ডাটাবেসে ইউজার খোঁজা
    let user = await User.findOne({ auth0Id: targetId }).select("-__v").lean();
    
    // যদি ইউজার ডাটাবেসে না থাকে এবং এটি নিজের প্রোফাইল হয়, তবে সিঙ্ক করবে
    if (!user && targetId === myId) {
      const newUser = new User({
        auth0Id: myId,
        name: req.user.name || "Drifter",
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
    2️⃣ UPDATE PROFILE & PHOTOS
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
    3️⃣ SEARCH DRIFTERS (The 500 Error Fix)
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const queryTerm = req.query.q || ""; 
    const currentUserId = req.user.sub || req.user.id;

    let query = { auth0Id: { $ne: currentUserId } };

    if (queryTerm.trim() !== "") {
      const searchRegex = new RegExp(queryTerm.trim(), "i");
      query.$or = [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
      ];
    }

    const users = await User.find(query)
      .select("name nickname avatar auth0Id bio isVerified")
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    console.error("🔍 SEARCH ERROR:", err.message);
    res.status(500).json({ msg: "Search signal lost", error: err.message });
  }
});

/* ==========================================================
    4️⃣ FOLLOW / UNFOLLOW SYSTEM
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) return res.status(400).json({ msg: "Self-link forbidden" });

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) return res.status(404).json({ msg: 'Target not found' });

    const isFollowing = targetUser.followers?.includes(myId);

    if (isFollowing) {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      res.json({ followed: false });
    } else {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      res.json({ followed: true });
    }
  } catch (err) {
    res.status(500).json({ msg: "Connection failed" });
  }
});

/* ==========================================================
    5️⃣ DISCOVERY & SYNC
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
    const users = await User.find({ auth0Id: { $ne: currentUserId } })
      .select("name nickname avatar auth0Id bio isVerified")
      .sort({ createdAt: -1 })
      .limit(20).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Discovery signal lost" });
  }
});

router.post('/sync', auth, async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    const user = await User.findOneAndUpdate(
      { auth0Id }, 
      { 
        $set: { 
          name, email, avatar: picture, 
          nickname: username?.replace(/\s+/g, '').toLowerCase() 
        } 
      },
      { upsert: true, new: true } 
    );
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Sync failed" });
  }
});

export default router;