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

    let user = await User.findOne({ auth0Id: myId }).select("-__v").lean();

    if (!user) {
      const newUser = new User({
        auth0Id: myId,
        name: req.auth.payload.name || "Drifter_" + myId.slice(-4),
        nickname: req.auth.payload.nickname || "drifter_" + Math.floor(Math.random() * 10000),
        avatar: req.auth.payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${myId}`,
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
    2️⃣ GET PROFILE BY ID
========================================================== */
router.get("/:id", async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    let user = await User.findOne({ auth0Id: targetId }).select("-__v").lean();
    
    if (!user) {
      return res.status(404).json({ msg: "Drifter node not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    3️⃣ UPDATE PROFILE
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

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.coverImg) updateFields.coverImg = req.files.coverImg[0].path;
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
    🔗 4️⃣ FOLLOW/UNFOLLOW LOGIC
========================================================== */
router.post("/follow/:targetId", async (req, res) => {
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
      return res.json({ linked: false, msg: "Link Severed" });
    } else {
      await User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } });
      await User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } });
      return res.json({ linked: true, msg: "Link Established" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Link protocol failed" });
  }
});

// Followers List (Manual lookup if populate fails)
router.get("/:id/followers", async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id });
    if (!user) return res.status(404).json([]);
    
    // Followers অ্যারেতে থাকা IDs দিয়ে ইউজারদের খুঁজে বের করা
    const followers = await User.find({ auth0Id: { $in: user.followers } })
                                .select('name nickname avatar auth0Id picture');
    res.json(followers);
  } catch (err) {
    res.status(500).json([]);
  }
});

// Following List
router.get("/:id/following", async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id });
    if (!user) return res.status(404).json([]);
    
    const following = await User.find({ auth0Id: { $in: user.following } })
                                .select('name nickname avatar auth0Id picture');
    res.json(following);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* ==========================================================
    🛰️ 5️⃣ GET USER SIGNALS (Posts)
========================================================== */
router.get("/posts/user/:userId", async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    // অরিজিনাল পোস্ট এবং মিডিয়া পোস্ট ফিল্টার করার সুবিধার্থে সব পোস্ট আনছি
    const posts = await Post.find({ authorAuth0Id: targetUserId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ posts, hasMore: false }); 
  } catch (err) {
    res.status(500).json({ msg: "Error fetching user signals" });
  }
});

export default router;