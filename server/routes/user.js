import express from 'express';
import User from '../models/User.js'; 
import Post from '../models/Post.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js';

const router = express.Router();

/* ==========================================================
    1️⃣ USER SYNC (লগইনের পর ডাটাবেসে সেভ করার জন্য)
    Path: /api/user/sync
========================================================== */
router.post('/sync', auth, async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    
    // ইউজারনেম থেকে স্পেস সরিয়ে ছোট হাতের অক্ষরে রূপান্তর
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
    2️⃣ SEARCH DRIFTERS
    Path: /api/user/search
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const queryTerm = req.query.q || ""; 
    const currentUserId = req.user.sub || req.user.id;

    let dbQuery = { 
      auth0Id: { $ne: currentUserId },
      name: { $exists: true, $ne: null } 
    };

    if (queryTerm.trim() !== "") {
      const searchRegex = new RegExp(queryTerm.trim(), "i");
      dbQuery.$or = [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
      ];
    }

    const users = await User.find(dbQuery)
      .hint({ _id: 1 }) // ডুপ্লিকেট ইনডেক্স এরর এড়াতে
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
    Path: /api/user/profile/:id
========================================================== */
router.get(['/profile/:id', '/:id'], auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const myId = req.user.sub || req.user.id;
    
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

/* ==========================================================
    4️⃣ UPDATE PROFILE
    Path: /api/user/update-profile
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
    Path: /api/user/posts/user/:userId
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
    Path: /api/user/follow/:targetId
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
    Path: /api/user/all
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
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