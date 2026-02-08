import express from 'express';
import User from '../models/User.js'; 
import Post from '../models/Post.js'; 
import upload from '../middleware/multer.js'; 

const router = express.Router();

/* ==========================================================
    1️⃣ GET CURRENT LOGGED-IN USER PROFILE
    এন্ডপয়েন্ট: GET /api/profile
========================================================== */
router.get("/", async (req, res) => {
  try {
    // Auth0 payload থেকে আইডি নেওয়া (server.js এ checkJwt মিডলওয়্যার এটি সেট করে)
    const myId = req.auth?.payload?.sub;

    if (!myId) {
      return res.status(401).json({ msg: "Neural Identity missing" });
    }

    let user = await User.findOne({ auth0Id: myId }).select("-__v").lean();

    // যদি ডাটাবেসে ইউজার না থাকে, তবে অটো-ক্রিয়েট (First time sync)
    if (!user) {
      console.log("🆕 Initializing New Neural Drifter Identity:", myId);
      
      const newUser = new User({
        auth0Id: myId,
        // Schema তে name রিকোয়ারড, তাই এটি নিশ্চিত করছি
        name: req.auth.payload.name || req.auth.payload.nickname || "Drifter_" + myId.slice(-4),
        nickname: req.auth.payload.nickname || "drifter_" + Math.floor(Math.random() * 10000),
        avatar: req.auth.payload.picture || `https://ui-avatars.com/api/?name=Drifter`,
        email: req.auth.payload.email || "",
        // Schema অনুযায়ী ডিফল্ট ভ্যালুগুলো অটোমেটিক বসবে
        neuralRank: 1, 
        drifterLevel: "Novice Drifter",
        isVerified: false
      });

      const savedUser = await newUser.save();
      user = savedUser.toObject();
    }
    
    res.json(user);
  } catch (err) {
    console.error("🔥 SERVER ERROR IN /api/profile:", err.message);
    res.status(500).json({ msg: "Neural link interrupted", error: err.message });
  }
});

/* ==========================================================
    2️⃣ GET PROFILE BY ID
    এন্ডপয়েন্ট: GET /api/profile/:id
========================================================== */
router.get(['/profile/:id', '/:id'], async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const myId = req.auth?.payload?.sub;
    
    let user = await User.findOne({ auth0Id: targetId }).select("-__v").lean();
    
    if (!user) {
      // যদি নিজের আইডি হয় কিন্তু ডাটাবেসে না থাকে
      if (targetId === myId) {
        const newUser = new User({
          auth0Id: myId,
          name: req.auth.payload.name || "Drifter",
          nickname: "drifter_" + myId.slice(-4),
          avatar: req.auth.payload.picture || ""
        });
        const savedUser = await newUser.save();
        user = savedUser.toObject();
      } else {
        // অন্য ইউজার না থাকলে একটি ভার্চুয়াল অবজেক্ট রিটার্ন
        return res.json({
          auth0Id: targetId,
          name: "Unknown Drifter",
          nickname: "drifter",
          avatar: `https://ui-avatars.com/api/?name=Drifter&background=random`,
          bio: "Neural profile not yet synced.",
          isVerified: false,
          followers: [],
          following: [],
          neuralRank: 1,
          drifterLevel: "Novice Drifter"
        });
      }
    }
    
    res.json(user);
  } catch (err) {
    console.error("📡 Target Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    3️⃣ UPDATE PROFILE (Unified)
    এন্ডপয়েন্ট: PUT /api/profile/update-profile
========================================================== */
router.put("/update-profile", upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub;
    const { nickname, name, bio, location, workplace, avatar: bodyAvatar } = req.body;

    let updateFields = {};
    if (name) updateFields.name = name;
    if (nickname) updateFields.nickname = nickname;
    if (bio) updateFields.bio = bio;
    if (location) updateFields.location = location;
    if (workplace) updateFields.workplace = workplace;
    if (bodyAvatar) updateFields.avatar = bodyAvatar;

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: myId }, 
      { $set: updateFields },
      { new: true, upsert: true, lean: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("📡 Update Error:", err);
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/* ==========================================================
    🚀 4️⃣ NEURAL RANK UPDATE
========================================================== */
router.patch("/update-rank", async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub;
    const { points } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: myId },
      { $inc: { neuralRank: points || 1 } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ msg: "Drifter not found" });

    res.json({ 
      success: true, 
      neuralRank: updatedUser.neuralRank, 
      drifterLevel: updatedUser.drifterLevel 
    });
  } catch (err) {
    console.error("📡 Rank Update Error:", err);
    res.status(500).json({ msg: "Neural Rank Sync Failed" });
  }
});

/* ==========================================================
    🔗 5️⃣ ESTABLISH LINK SYSTEM (Follow/Unfollow)
========================================================== */
router.post("/establish-link/:targetId", async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub; 
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) {
      return res.status(400).json({ msg: "Neural Loop: Cannot link with self." });
    }

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) {
      return res.status(404).json({ msg: "Target node not found" });
    }

    const isLinked = targetUser.followers && targetUser.followers.includes(myId);

    if (isLinked) {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      return res.json({ linked: false, msg: "Neural Link Severed! 🛑" });
    } else {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      return res.json({ linked: true, msg: "Neural Link Established! ⚡" });
    }
  } catch (err) {
    console.error("📡 Linking Error:", err);
    res.status(500).json({ msg: "Link protocol failed" });
  }
});

/* ==========================================================
    🔎 6️⃣ SEARCH DRIFTERS
========================================================== */
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    const myId = req.auth?.payload?.sub;
    
    let filter = { auth0Id: { $ne: myId } };

    if (query && query.trim() !== "") {
      const searchRegex = new RegExp(query.trim(), "i");
      filter.$or = [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } },
        { auth0Id: { $regex: searchRegex } }
      ];
    }

    const users = await User.find(filter)
      .select("name nickname avatar auth0Id bio isVerified neuralRank drifterLevel")
      .limit(10)
      .lean();

    res.json(users);
  } catch (err) {
    console.error("📡 Search Error:", err);
    res.status(500).json({ msg: "Search signal lost" });
  }
});

/* ==========================================================
    🌍 7️⃣ DISCOVERY (Active Nodes)
========================================================== */
router.get("/all", async (req, res) => {
  try {
    const myId = req.auth?.payload?.sub;
    const users = await User.find({ auth0Id: { $ne: myId } })
      .select("name nickname avatar auth0Id bio isVerified neuralRank drifterLevel")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Discovery signal lost" });
  }
});

/* ==========================================================
    🛰️ 8️⃣ GET USER SIGNALS (Posts)
========================================================== */
router.get("/posts/user/:userId", async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    const posts = await Post.find({
      $or: [
        { authorAuth0Id: targetUserId },
        { userId: targetUserId },
        { author: targetUserId }
      ]
    }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("📡 User Posts Error:", err);
    res.status(500).json({ msg: "Error fetching user signals" });
  }
});

export default router;