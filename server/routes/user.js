import express from 'express';
import User from '../models/User.js'; 
import Post from '../models/Post.js'; 
// আপনার প্রোভাইড করা server.js অনুযায়ী middleware চেক করুন
// এখানে 'req.auth' অথবা 'req.user' হ্যান্ডেল করার জন্য ফিক্স করা হয়েছে।

const router = express.Router();

/* ==========================================================
    🧠 HELPER: GET AUTH ID
    Auth0 থেকে আসা আইডিটি req.auth অথবা req.user থেকে নিরাপদে বের করার জন্য
========================================================== */
const getAuthId = (req) => req.auth?.payload?.sub || req.user?.sub || req.user?.id;

/* ==========================================================
    1️⃣ USER SYNC (লগইনের পর ডাটাবেসে সেভ করার জন্য)
========================================================== */
router.post('/sync', async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    
    if (!auth0Id) return res.status(400).json({ message: "Auth0Id is required" });

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
========================================================== */
router.get("/search", async (req, res) => {
  try {
    const queryTerm = req.query.q || ""; 
    const currentUserId = getAuthId(req);

    let dbQuery = { 
      name: { $exists: true, $ne: null } 
    };

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
router.get(['/profile/:id', '/:id'], async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.id);
    const myId = getAuthId(req);
    
    let user = await User.findOne({ auth0Id: targetId }).select("-__v").lean();
    
    // যদি নিজের প্রোফাইল হয় এবং ডাটাবেসে না থাকে, তবে নতুন তৈরি হবে
    if (!user && targetId === myId && myId) {
      const newUser = new User({
        auth0Id: myId,
        name: "New Drifter",
        nickname: `drifter_${Math.floor(Math.random() * 10000)}`,
        avatar: "",
        isVerified: false
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
    4️⃣ UPDATE PROFILE (With Multi-part Support)
========================================================== */
router.put("/update-profile", upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const targetAuth0Id = getAuthId(req);

    if (!targetAuth0Id) return res.status(401).json({ msg: "Unauthorized: No ID found" });

    let updateFields = { name, nickname, bio, location, workplace };

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    // খালি ফিল্ডগুলো রিমুভ করা
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
    5️⃣ LEADERBOARD
========================================================== */
router.get('/leaderboard', async (req, res) => {
  try {
    const topDrifters = await User.find()
      .sort({ neuralImpact: -1 }) 
      .limit(10)
      .select('name nickname avatar neuralImpact neuralRank');

    res.json(topDrifters);
  } catch (err) {
    res.status(500).json({ error: "Leaderboard link unstable" });
  }
});

/* ==========================================================
    6️⃣ GET POSTS BY USER ID
========================================================== */
router.get("/posts/user/:userId", async (req, res) => {
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
    7️⃣ FOLLOW / UNFOLLOW
========================================================== */
router.post("/follow/:targetId", async (req, res) => {
  try {
    const myId = getAuthId(req);
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
    console.error("Follow Error:", err);
    res.status(500).json({ msg: "Connection failed" });
  }
});

/* ==========================================================
    8️⃣ DISCOVERY (All Users)
========================================================== */
router.get("/all", async (req, res) => {
  try {
    const currentUserId = getAuthId(req);
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