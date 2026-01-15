import express from 'express';
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js';

const router = express.Router();

/* ==========================================================
    1️⃣ GET PROFILE BY ID (With Auto-Sync to fix 404 Error)
========================================================== */
router.get(['/:id', '/profile/:id'], auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    
    let user = await User.findOne({ auth0Id: targetId })
      .select("-__v")
      .lean();
    
    if (!user) {
      const myId = req.user.sub || req.user.id;
      
      if (targetId === myId) {
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
        console.log("🆕 New Neural Identity Synced:", targetId);
      } else {
        return res.status(404).json({ msg: "Drifter not found in neural network" });
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
    3️⃣ SEARCH DRIFTERS (Neural Scan)
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.sub || req.user.id;

    if (!query) {
       const all = await User.find({ auth0Id: { $ne: currentUserId } }).limit(10).lean();
       return res.json(all);
    }

    const searchRegex = new RegExp(`${query.trim()}`, "i");

    const users = await User.find({
      auth0Id: { $ne: currentUserId },
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
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
    4️⃣ FOLLOW / UNFOLLOW SYSTEM (Fixed Logic)
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) return res.status(400).json({ msg: "Self-link forbidden" });

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) return res.status(404).json({ msg: "Target not found" });

    //followers অ্যারে চেক করা (যদি না থাকে তবে খালি অ্যারে ধরে নেওয়া)
    const isFollowing = targetUser.followers ? targetUser.followers.includes(myId) : false;

    if (isFollowing) {
      // Unfollow Logic
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      res.json({ followed: false });
    } else {
      // Follow Logic
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      res.json({ followed: true });
    }
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ msg: "Connection failed" });
  }
});

/* ==========================================================
    5️⃣ DISCOVERY
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