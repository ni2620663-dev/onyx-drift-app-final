import express from 'express';
import User from '../models/User.js'; 
import Post from '../models/Post.js'; 
import upload from '../middleware/multer.js'; 

const router = express.Router();

/* ==========================================================
    1️⃣ GET CURRENT LOGGED-IN USER PROFILE (Self)
========================================================== */
router.get("/me", async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub; 
    if (!myId) return res.status(401).json({ msg: "Neural Identity missing" });

    let user = await User.findOne({ auth0Id: myId }).select("-__v");

    if (!user) {
      // যদি ডাটাবেসে ইউজার না থাকে তবে নতুন তৈরি হবে (Auth0 Sync)
      user = new User({
        auth0Id: myId,
        name: req.auth.payload.name || "Drifter_" + myId.slice(-4),
        nickname: req.auth.payload.nickname || "drifter_" + Math.floor(Math.random() * 10000),
        avatar: req.auth.payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${myId}`,
        email: req.auth.payload.email || "",
      });
      await user.save();
    }
    
    // X-style metadata
    const userData = user.toObject();
    userData.followersCount = user.followers?.length || 0;
    userData.followingCount = user.following?.length || 0;
    userData.isMe = true;

    res.json(userData);
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    2️⃣ GET PROFILE BY ID / USERNAME (Public)
========================================================== */
router.get("/:id", async (req, res) => {
  try {
    // URL এ থাকা %7C কে হ্যান্ডেল করার জন্য decode করা হলো
    const targetId = decodeURIComponent(req.params.id);
    const myId = req.auth?.payload?.sub;

    let user = await User.findOne({ 
      $or: [{ auth0Id: targetId }, { nickname: targetId }] 
    }).select("-__v");
    
    if (!user) {
      return res.status(404).json({ msg: "Drifter node not found" });
    }

    const userData = user.toObject();
    userData.followersCount = user.followers?.length || 0;
    userData.followingCount = user.following?.length || 0;
    userData.isMe = (user.auth0Id === myId);
    userData.isFollowing = user.followers?.includes(myId);

    res.json(userData);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    3️⃣ UPDATE PROFILE (With Avatar & Cover)
========================================================== */
router.put("/update", upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverImg', maxCount: 1 } 
]), async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub;
    if (!myId) return res.status(401).json({ msg: "Unauthorized" });

    const { nickname, name, bio, location, website } = req.body;
    let updateFields = { name, nickname, bio, location, website };

    // ফাইল আপলোড থাকলে পাথ আপডেট (Cloudinary বা Multer এর মাধ্যমে)
    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.coverImg) updateFields.coverImg = req.files.coverImg[0].path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: myId }, 
      { $set: updateFields },
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/* ==========================================================
    🔗 4️⃣ FOLLOW/UNFOLLOW LOGIC (Real-time update)
========================================================== */
router.post("/follow/:targetId", async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub; 
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) return res.status(400).json({ msg: "Neural Loop Error" });

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) return res.status(404).json({ msg: "Target not found" });

    // চেক করা হচ্ছে আপনি অলরেডি ফলো করছেন কিনা
    const isFollowing = targetUser.followers.includes(myId);

    if (isFollowing) {
      // Unfollow logic
      await User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } });
      await User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId } });
      return res.json({ isFollowing: false, msg: "Link Severed" });
    } else {
      // Follow logic
      await User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } });
      await User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId } });
      return res.json({ isFollowing: true, msg: "Link Established" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Link protocol failed" });
  }
});

/* ==========================================================
    🛰️ 5️⃣ GET USER SIGNALS (Posts List)
========================================================== */
router.get("/posts/:userId", async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    // ইউজারের পোস্টগুলো টাইমলাইন অনুযায়ী লোড করা
    const posts = await Post.find({ 
      $or: [{ authorAuth0Id: targetUserId }, { author: targetUserId }] 
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json(posts); 
  } catch (err) {
    res.status(500).json({ msg: "Error fetching user signals" });
  }
});

export default router;
