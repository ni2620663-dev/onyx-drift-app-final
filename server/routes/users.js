import express from 'express';
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js'; 
import Post from '../models/Post.js'; 

const router = express.Router();

/* ==========================================================
    1️⃣ GET PROFILE BY ID (With Auto-Sync & 404 Fix)
    ফেসবুকের মতো এই আইডিটিই প্রোফাইল চাবিকাঠি
========================================================== */
router.get(['/profile/:id', '/:id'], auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const myId = req.user.sub || req.user.id;
    
    let user = await User.findOne({ auth0Id: targetId })
      .select("-__v")
      .lean();
    
    if (!user) {
      if (targetId === myId) {
        const newUser = new User({
          auth0Id: myId,
          name: req.user.name || "Drifter",
          nickname: req.user.nickname || req.user.name?.split(' ')[0].toLowerCase() || "drifter",
          avatar: req.user.picture || "",
          email: req.user.email || ""
        });
        const savedUser = await newUser.save();
        user = savedUser.toObject();
        console.log("🆕 Neural Identity Created:", targetId);
      } else {
        return res.json({
          auth0Id: targetId,
          name: "Unknown Drifter",
          nickname: "drifter",
          avatar: `https://ui-avatars.com/api/?name=Drifter&background=random`,
          bio: "Neural profile not yet synced.",
          isVerified: false
        });
      }
    }
    
    res.json(user);
  } catch (err) {
    console.error("📡 Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural link interrupted" });
  }
});

/* ==========================================================
    2️⃣ UPDATE PROFILE
========================================================== */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const myId = req.user.sub || req.user.id;

    let updateFields = {};
    if (name) updateFields.name = name;
    if (nickname) updateFields.nickname = nickname;
    if (bio) updateFields.bio = bio;
    if (location) updateFields.location = location;
    if (workplace) updateFields.workplace = workplace;

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
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/* ==========================================================
    3️⃣ UPDATE PHOTO
========================================================== */
router.post("/update-photo", auth, upload.single('image'), async (req, res) => {
  try {
    const { type } = req.body; 
    const myId = req.user.sub || req.user.id;
    
    if (!req.file) return res.status(400).json({ msg: "No image received" });

    let updateFields = {};
    if (type === 'profile') {
      updateFields.avatar = req.file.path;
    } else if (type === 'cover') {
      updateFields.coverImg = req.file.path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: myId },
      { $set: updateFields },
      { new: true, lean: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("📡 Photo Update Error:", err);
    res.status(500).json({ msg: "Neural Sync Failed" });
  }
});

/* ==========================================================
    4️⃣ SEARCH & DISCOVERY (ফেসবুক স্টাইল সার্চ)
    নাম বা নেকনেম লিখলে ওই ইউজারের আইডি রিটার্ন করবে
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const myId = req.user.sub || req.user.id;
    
    // নিজের আইডি বাদে অন্য সব আইডি খোঁজার ফিল্টার
    let filter = { auth0Id: { $ne: myId } };

    if (query && query.trim() !== "") {
      const searchRegex = new RegExp(query.trim(), "i");
      
      // নাম, নেকনেম বা আইডির আংশিক মিল খুঁজবে
      filter.$or = [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } },
        { auth0Id: { $regex: searchRegex } }
      ];
    }

    const users = await User.find(filter)
      .select("name nickname avatar auth0Id bio isVerified followers following")
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    console.error("📡 Search Error:", err);
    res.status(500).json({ msg: "Search signal lost" });
  }
});

/* ==========================================================
    5️⃣ FOLLOW / UNFOLLOW SYSTEM
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub; 
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) {
      return res.status(400).json({ 
        msg: "Neural Loop Detected: You cannot link with yourself.",
        selfLink: true 
      });
    }

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) {
      return res.status(404).json({ msg: "Target drifter not found in neural core" });
    }

    const isFollowing = targetUser.followers && targetUser.followers.includes(myId);

    if (isFollowing) {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myId } })
      ]);
      return res.json({ followed: false, msg: "Disconnected from node" });
    } else {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myId } })
      ]);
      return res.json({ followed: true, msg: "Neural Link Established" });
    }
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ msg: "Neural link failed due to core error" });
  }
});

/* ==========================================================
    6️⃣ DISCOVERY (All Users)
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const users = await User.find({ auth0Id: { $ne: myId } })
      .select("name nickname avatar auth0Id bio isVerified")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Discovery signal lost" });
  }
});

/* ==========================================================
    7️⃣ FIXED: GET POSTS BY USER ID
========================================================== */
router.get("/posts/user/:userId", auth, async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    const posts = await Post.find({
      $or: [
        { authorAuth0Id: targetUserId },
        { userId: targetUserId },
        { author: targetUserId } // আপনার মডেল অনুযায়ী 'author' ও থাকতে পারে
      ]
    }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("📡 User Posts Fetch Error:", err);
    res.status(500).json({ msg: "Error fetching user signals" });
  }
});

export default router;