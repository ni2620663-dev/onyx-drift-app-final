import express from 'express';
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js'; 
import Post from '../models/Post.js'; 

const router = express.Router();

/* ==========================================================
    1️⃣ GET PROFILE BY ID
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
          isVerified: false,
          followers: [],
          following: []
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
    const { nickname, name, bio, location, workplace, avatar: bodyAvatar } = req.body;
    const myId = req.user.sub || req.user.id;

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
    6️⃣ GET PROFILE AND POSTS BY USER ID
========================================================== */
router.get("/profile/:userId", auth, async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    // ১. ইউজার প্রোফাইল খুঁজুন
    const userProfile = await User.findOne({ auth0Id: targetUserId })
      .select("-__v")
      .lean();

    if (!userProfile) {
      return res.status(404).json({ msg: "Drifter not found" });
    }

    // ২. ওই ইউজারের সব পোস্ট খুঁজুন (authorAuth0Id অথবা author ফিল্ড চেক করে)
    const userPosts = await Post.find({
      $or: [
        { authorAuth0Id: targetUserId },
        { author: targetUserId }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    // ৩. অবজেক্ট আকারে ডাটা পাঠান যাতে ফ্রন্টএন্ড সহজে ধরতে পারে
    res.json({
      user: userProfile,
      posts: userPosts
    });
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ msg: "Neural signal lost" });
  }
});

/* ==========================================================
    3️⃣ GET POSTS BY USER ID (FIXED ROUTE)
========================================================== */
// এই রুটটি নিশ্চিত করুন ফ্রন্টএন্ড থেকে /api/users/user-posts/:userId কল করা হচ্ছে
router.get("/user-posts/:userId", auth, async (req, res) => {
  try {
    const targetUserId = decodeURIComponent(req.params.userId);
    
    const posts = await Post.find({
      $or: [
        { authorAuth0Id: targetUserId },
        { author: targetUserId }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json(posts);
  } catch (err) {
    console.error("📡 User Posts Error:", err);
    res.status(500).json({ msg: "Error fetching user signals" });
  }
});
/* ==========================================================
    🚀 2.5 NEURAL RANK UPDATE (New Feature)
    প্রতি ১০০ মেসেজে ১ পয়েন্ট যোগ করার জন্য
========================================================== */
router.patch("/update-rank", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const { points } = req.body;

    // $inc ব্যবহার করে পয়েন্ট বাড়ানো হচ্ছে এবং Pre-save হুক drifterLevel আপডেট করবে
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
    3️⃣ SEARCH USERS
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const myId = req.user.sub || req.user.id;
    
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
    4️⃣ FOLLOW / UNFOLLOW SYSTEM
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id; 
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) {
      return res.status(400).json({ msg: "Neural Loop: You cannot link with yourself." });
    }

    const targetUser = await User.findOne({ auth0Id: targetId });
    if (!targetUser) {
      return res.status(404).json({ msg: "Target drifter not found" });
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
    console.error("📡 Follow Error:", err);
    res.status(500).json({ msg: "Connection failed" });
  }
});

/* ==========================================================
    5️⃣ DISCOVERY (All Users)
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
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
    6️⃣ GET POSTS BY USER ID
========================================================== */
router.get("/posts/user/:userId", auth, async (req, res) => {
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