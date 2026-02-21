import express from 'express';
import User from '../models/User.js'; 
import Post from '../models/Post.js'; 
import upload from '../middleware/multer.js'; 

const router = express.Router();

/* ==========================================================
    1️⃣ GET CURRENT LOGGED-IN USER PROFILE
========================================================== */
router.get("/", async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub;
    if (!myId) return res.status(401).json({ msg: "Neural Identity missing" });

    // ডাটাবেজে ইউজার খোঁজা (auth0Id দিয়ে)
    let user = await User.findOne({ auth0Id: myId }).select("-__v").lean();

    if (!user) {
      // যদি ইউজার ডাটাবেজে না থাকে, তবে নতুন প্রোফাইল তৈরি করা
      const newUser = new User({
        auth0Id: myId,
        name: req.auth.payload.name || "Drifter_" + myId.slice(-4),
        nickname: req.auth.payload.nickname || "drifter_" + Math.floor(Math.random() * 10000),
        avatar: req.auth.payload.picture || `https://ui-avatars.com/api/?name=Drifter&background=06b6d4&color=fff`,
        email: req.auth.payload.email || "",
        neuralRank: 1, 
        drifterLevel: "Novice Drifter",
        isVerified: false
      });
      const savedUser = await newUser.save();
      user = savedUser.toObject();
    }
    res.json(user);
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    2️⃣ GET PROFILE BY ID (URL parameter decode fixed)
========================================================== */
router.get("/:id", async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    
    // ডাটাবেজে ইউজার খোঁজা
    let user = await User.findOne({ auth0Id: targetId }).select("-__v").lean();
    
    if (!user) {
      return res.status(404).json({ msg: "Drifter node not found in this sector" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    3️⃣ UPDATE PROFILE (Unified Update Logic)
========================================================== */
router.put("/update-profile", upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub;
    if (!myId) return res.status(401).json({ msg: "Unauthorized" });

    const { nickname, name, bio, location, website } = req.body;
    let updateFields = { name, nickname, bio, location, website };

    // মাল্টার ফাইল হ্যান্ডলিং (Cloudinary URL থাকলে সেটি আপডেট হবে)
    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: myId }, 
      { $set: updateFields },
      { new: true, lean: true }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/* ==========================================================
    🔗 4️⃣ ESTABLISH LINK (Follow/Unfollow logic)
========================================================== */
router.post("/establish-link/:targetId", async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub; 
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) return res.status(400).json({ msg: "Neural Loop Error" });

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) return res.status(404).json({ msg: "Target not found" });

    const isLinked = targetUser.followers.includes(myId);

    if (isLinked) {
      await User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } });
      await User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } });
      return res.json({ linked: false, msg: "Neural Link Severed! 🛑" });
    } else {
      await User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } });
      await User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } });
      return res.json({ linked: true, msg: "Neural Link Established! ⚡" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Link protocol failed" });
  }
});

/* ==========================================================
    🛰️ 5️⃣ GET USER SIGNALS (Posts with Author Data)
========================================================== */
router.get("/posts/user/:userId", async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    // ডাটাবেজে পোস্ট খোঁজা (authorAuth0Id ফিল্ড ব্যবহার করে)
    const posts = await Post.find({ authorAuth0Id: targetUserId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching user signals" });
  }
});

export default router;