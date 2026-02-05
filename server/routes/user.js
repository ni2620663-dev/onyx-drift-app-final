import express from 'express';
import User from '../models/User.js'; 
import Post from '../models/Post.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js';

const router = express.Router();

/* ==========================================================
    1️⃣ USER SYNC (লগইনের পর ডাটাবেসে সেভ করার জন্য)
========================================================== */
router.post('/sync', auth, async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    
    const cleanNickname = username 
      ? username.replace(/\s+/g, '').toLowerCase() 
      : `drifter_${Date.now()}`;

    const user = await User.findOneAndUpdate(
      { auth0Id }, 
      { 
        $set: { 
          name, 
          email, 
          avatar: picture, 
          nickname: cleanNickname 
        } 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } 
    );
    
    console.log("✅ User Synced:", user.auth0Id);
    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Sync Error:", err.message);
    res.status(500).json({ message: "Sync failed", error: err.message });
  }
});

/* ==========================================================
    2️⃣ SEARCH DRIFTERS (Fail-safe Version)
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const queryTerm = req.query.q || ""; 
    
    // 🛡️ সাবধানে আইডি চেক করা হচ্ছে যাতে ক্রাশ না করে
    const currentUserId = req.user ? (req.user.sub || req.user.id) : null;

    let dbQuery = { 
      name: { $exists: true, $ne: null } 
    };

    // নিজেকে সার্চ রেজাল্ট থেকে বাদ দেওয়া (যদি আইডি থাকে)
    if (currentUserId) {
      dbQuery.auth0Id = { $ne: currentUserId };
    }

    if (queryTerm.trim() !== "") {
      const searchRegex = new RegExp(queryTerm.trim(), "i");
      dbQuery.$or = [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
      ];
    }

    const users = await User.find(dbQuery)
      .select("name nickname avatar auth0Id bio isVerified neuralRank drifterLevel")
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    console.error("🔍 SEARCH ERROR:", err.message);
    res.status(500).json({ msg: "Search signal lost", error: err.message });
  }
});

/* ==========================================================
    3️⃣ GET PROFILE BY ID
========================================================== */
router.get(['/profile/:id', '/:id'], auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const myId = req.user ? (req.user.sub || req.user.id) : null;
    
    let user = await User.findOne({ auth0Id: targetId }).select("-__v").lean();
    
    if (!user && targetId === myId) {
      const newUser = new User({
        auth0Id: myId,
        name: req.user.name || "Drifter",
        nickname: req.user.nickname || `drifter_${Math.floor(Math.random() * 1000)}`,
        avatar: req.user.picture || "",
        isVerified: false,
        followers: [],
        following: []
      });
      const savedUser = await newUser.save();
      user = savedUser.toObject();
    }
    
    if (!user) return res.status(404).json({ msg: "Drifter not found" });
    
    res.json(user);
  } catch (err) {
    console.error("📡 Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

// ১. প্রোফাইল আপডেট রাউট
router.put('/profile/update', async (req, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user.sub; // Auth0 থেকে আসা আইডি

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: userId },
      { $set: { name, bio } },
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to sync identity" });
  }
});

// ২. লিডারবোর্ড রাউট (সবচেয়ে বেশি Neural Impact যাদের)
router.get('/leaderboard', async (req, res) => {
  try {
    const topDrifters = await User.find()
      .sort({ neuralImpact: -1 }) // সবচেয়ে বেশি ইমপ্যাক্ট আগে
      .limit(10)
      .select('name nickname avatar neuralImpact neuralRank');

    res.json(topDrifters);
  } catch (err) {
    res.status(500).json({ error: "Leaderboard link unstable" });
  }
});
/* ==========================================================
    4️⃣ UPDATE PROFILE
========================================================== */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const targetAuth0Id = req.user ? (req.user.sub || req.user.id) : null;

    if (!targetAuth0Id) return res.status(401).json({ msg: "Unauthorized" });

    let updateFields = { name, nickname, bio, location, workplace };

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

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
    5️⃣ GET POSTS BY USER ID
========================================================== */
router.get("/posts/user/:userId", auth, async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    const posts = await Post.find({
      $or: [
        { authorAuth0Id: targetUserId },
        { userId: targetUserId }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json(posts);
  } catch (err) {
    console.error("📡 User Posts Error:", err);
    res.status(500).json({ msg: "Error fetching user signals" });
  }
});

/* ==========================================================
    6️⃣ FOLLOW / UNFOLLOW
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user ? (req.user.sub || req.user.id) : null;
    const targetId = decodeURIComponent(req.params.targetId);

    if (!myId) return res.status(401).json({ msg: "Unauthorized" });
    if (myId === targetId) return res.status(400).json({ msg: "Self-link forbidden" });

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) return res.status(404).json({ msg: 'Target not found' });

    const isFollowing = targetUser.followers?.includes(myId);

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
    res.status(500).json({ msg: "Connection failed" });
  }
});

/* ==========================================================
    7️⃣ DISCOVERY (All Users)
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user ? (req.user.sub || req.user.id) : null;
    const users = await User.find({ auth0Id: { $ne: currentUserId } })
      .select("name nickname avatar auth0Id bio isVerified neuralRank drifterLevel")
      .sort({ createdAt: -1 })
      .limit(20).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Discovery signal lost" });
  }
});

export default router;