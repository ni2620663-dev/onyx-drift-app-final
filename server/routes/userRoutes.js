import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js'; 
import User from '../models/User.js';
import { createPost } from '../controllers/postController.js';

const router = express.Router();

/* ==========================================================
    ⚙️ MULTER CONFIGURATION
========================================================== */
const storage = multer.diskStorage({});
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } 
});

/* ==========================================================
    🚀 ROUTES
========================================================== */

/**
 * ১. ইউজার ডাটা সিঙ্ক (এটিই ডাটাবেসে ইউজার সেভ করবে)
 * Neural Stats (mood, impact, memory) ডিফল্ট ভ্যালুসহ অ্যাড করা হয়েছে
 */
// ইউজারের কেনাকাটা প্রসেস করার এপিআই
router.post("/purchase-item", auth, async (req, res) => {
  try {
    const { itemId, cost, isPointsPayment } = req.body;
    const auth0Id = req.user.sub || req.user.id;

    const user = await User.findOne({ auth0Id });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // যদি পয়েন্ট দিয়ে কিনতে চায়
    if (isPointsPayment) {
      if (user.neuralImpact < cost) {
        return res.status(400).json({ msg: "Insufficient Impact Points" });
      }

      // ডাটাবেস আপডেট: পয়েন্ট কমানো এবং আইটেম লিস্টে অ্যাড করা
      const updatedUser = await User.findOneAndUpdate(
        { auth0Id },
        { 
          $inc: { neuralImpact: -cost },
          $addToSet: { unlockedAssets: itemId } // ডুপ্লিকেট আইটেম রোধ করবে
        },
        { new: true }
      );

      console.log(`🎁 Asset Unlocked: ${itemId} for ${user.name}`);
      return res.status(200).json({ success: true, balance: updatedUser.neuralImpact });
    }

    // যদি টাকা দিয়ে কেনা হয় (পেমেন্ট গেটওয়ে সাকসেস হওয়ার পর এটি কল হবে)
    await User.updateOne(
      { auth0Id },
      { $addToSet: { unlockedAssets: itemId } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Purchase Error:", err);
    res.status(500).json({ msg: "Transaction failed" });
  }
});
// একটি নির্দিষ্ট অ্যাসেট একটিভ করার রাউট
router.post("/equip-asset", auth, async (req, res) => {
  try {
    const { assetId, category } = req.body; // category হতে পারে 'aura', 'badge', 'mode'
    const auth0Id = req.user.sub || req.user.id;

    // ইউজারের প্রোফাইলে একটিভ সেটিংস আপডেট করা
    const updateField = {};
    if (category === 'aura') updateField['profileSettings.activeAura'] = assetId;
    if (category === 'badge') updateField['profileSettings.activeBadge'] = assetId;

    await User.findOneAndUpdate({ auth0Id }, { $set: updateField });

    res.status(200).json({ success: true, message: "Profile synchronized with new asset." });
  } catch (err) {
    res.status(500).json({ msg: "Neural Link Error" });
  }
});
// PUT: api/user/equip-asset
router.put("/equip-asset", auth, async (req, res) => {
  const { assetId, type } = req.body; // type: 'aura' | 'badge'
  
  try {
    const update = type === 'aura' 
      ? { "profileSettings.activeAura": assetId } 
      : { "profileSettings.activeBadge": assetId };

    const user = await User.findOneAndUpdate(
      { auth0Id: req.user.sub },
      { $set: update },
      { new: true }
    );
    
    res.json({ success: true, settings: user.profileSettings });
  } catch (err) {
    res.status(500).send("Sync Error");
  }
});
router.post("/purchase", auth, async (req, res) => {
  try {
    const { itemId, cost } = req.body;
    const auth0Id = req.user.sub || req.user.id;

    const user = await User.findOne({ auth0Id });

    if (user.neuralImpact < cost) {
      return res.status(400).json({ msg: "Insufficient points" });
    }

    // ১. পয়েন্ট কমানো
    // ২. আনলকড আইটেম লিস্টে অ্যাড করা (যদি ডাটাবেসে array থাকে)
    await User.updateOne(
      { auth0Id },
      { 
        $inc: { neuralImpact: -cost },
        $addToSet: { unlockedAssets: itemId } // ইউজারের মডেলে 'unlockedAssets' ফিল্ড লাগবে
      }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Transaction Error" });
  }
});
router.post('/sync', auth, async (req, res) => {
  try {
    const { auth0Id, name, email, picture, username } = req.body;
    
    const user = await User.findOneAndUpdate(
      { auth0Id: auth0Id }, 
      { 
        $set: { 
          name: name,
          email: email,
          avatar: picture,
          nickname: username?.replace(/\s+/g, '').toLowerCase() || `drifter_${Math.floor(Math.random() * 1000)}`
        },
        // নতুন ইউজার হলে এই ডিফল্ট ভ্যালুগুলো সেট হবে
        $setOnInsert: {
          neuralImpact: 0,
          neuralRank: "Novice Drifter",
          moodStats: { motivated: 50, creative: 30, calm: 20 },
          memoryVaultCount: 0
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } 
    );

    console.log(`✅ Neural Sync: ${user.name} is now in Database.`);
    res.status(200).json(user);
  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ message: "Identity sync failed" });
  }
});

/**
 * ২. ড্রিপ্টার সার্চ
 */
// ১. গ্লোবাল লিডারবোর্ড ডাটা (Top 10 Drifters)
router.get("/leaderboard", async (req, res) => {
  try {
    const topDrifters = await User.find({})
      .sort({ neuralImpact: -1 }) // পয়েন্ট অনুযায়ী সাজানো
      .limit(10)
      .select("name avatar neuralImpact neuralRank unlockedAssets");
    res.json(topDrifters);
  } catch (err) {
    res.status(500).send("Sync Error");
  }
});

// ২. প্রিমিয়াম ফিড (যেখানে ব্যাজওয়ালা ইউজারদের পোস্ট হাইলাইট হবে)
router.get("/global-feed", async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "name avatar unlockedAssets profileSettings")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).send("Neural Link Broken");
  }
});
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") return res.json([]);

    const currentUserId = req.user.sub || req.user.id;
    const searchRegex = new RegExp(`${query.trim()}`, "i");

    const users = await User.find({
      auth0Id: { $ne: currentUserId }, 
      $or: [
        { name: { $regex: searchRegex } },
        { nickname: { $regex: searchRegex } }
      ]
    })
    .select("name nickname avatar auth0Id bio isVerified followers following neuralImpact neuralRank")
    .limit(12)
    .lean();
    
    res.status(200).json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search signal lost" });
  }
});

/**
 * ৩. প্রোফাইল আপডেট
 */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    const targetAuth0Id = req.user.sub || req.user.id;
    let updateFields = {};
    
    if (name) updateFields.name = name;
    if (nickname) updateFields.nickname = nickname.replace(/\s+/g, '').toLowerCase();
    if (bio) updateFields.bio = bio;
    if (location) updateFields.location = location;
    if (workplace) updateFields.workplace = workplace;

    if (req.files) {
      if (req.files.avatar) updateFields.avatar = req.files.avatar[0].path;
      if (req.files.cover) updateFields.coverImg = req.files.cover[0].path;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id }, 
      { $set: updateFields },
      { new: true, upsert: true, lean: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: 'Identity Sync Failed' });
  }
});

/**
 * ৪. প্রোফাইল এবং পোস্ট একসাথে পাওয়া (Neural Stats সহ)
 */
router.get(['/profile/:userId', '/:userId'], auth, async (req, res, next) => {
  try {
    const rawUserId = req.params.userId;
    if (!rawUserId || ['search', 'all', 'undefined'].includes(rawUserId)) {
        return next();
    }

    const targetId = decodeURIComponent(rawUserId);

    const user = await User.findOne({ auth0Id: targetId }).lean();
    
    const posts = await Post.find({ 
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { userId: targetId }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      user: user || { 
        auth0Id: targetId, 
        name: "Unknown Drifter", 
        avatar: "", 
        bio: "Neural profile not found.",
        neuralImpact: 0,
        moodStats: { motivated: 0, creative: 0, calm: 0 }
      },
      posts: posts || []
    });
  } catch (err) {
    res.status(500).json({ message: "Neural Link Error" });
  }
});

/**
 * ৫. নতুন পোস্ট তৈরি
 */
router.post('/create', auth, upload.single('file'), createPost);

/**
 * ৬. ফলো সিস্টেম (ইমপ্যাক্ট পয়েন্ট আপডেট লজিকসহ)
 */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const targetId = decodeURIComponent(req.params.targetId);

    if (myId === targetId) return res.status(400).json({ msg: "Self-link forbidden" });

    const [targetUser, currentUser] = await Promise.all([
        User.findOne({ auth0Id: targetId }),
        User.findOne({ auth0Id: myId })
    ]);

    if (!targetUser || !currentUser) return res.status(404).json({ msg: "User connection failed" });

    const isFollowing = currentUser.following && currentUser.following.includes(targetId);

    if (isFollowing) {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $pull: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $pull: { followers: myId }, $inc: { neuralImpact: -5 } }) // আনফলো করলে ইমপ্যাক্ট কমবে
      ]);
      res.json({ followed: false });
    } else {
      await Promise.all([
        User.updateOne({ auth0Id: myId }, { $addToSet: { following: targetId } }),
        User.updateOne({ auth0Id: targetId }, { $addToSet: { followers: myId }, $inc: { neuralImpact: 10 } }) // ফলো করলে ইমপ্যাক্ট বাড়বে
      ]);
      res.json({ followed: true });
    }
  } catch (err) {
    res.status(500).json({ msg: "Connection failed" });
  }
});
router.put('/toggle-autopilot', auth, toggleAutopilot);
router.put('/update-ai-tone', auth, updateAiTone);
router.put('/toggle-ghost', auth, toggleGhostMode);
/**
 * ৭. (NEW) Neural Stats Update - ইমপ্যাক্ট ও মুড আপডেট করার জন্য
 */
router.put("/sync-neural-stats", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const { impactGain, newMood } = req.body;

    const updateData = {};
    if (impactGain) updateData.$inc = { neuralImpact: impactGain };
    if (newMood) updateData.$set = { moodStats: newMood };

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: myId },
      updateData,
      { new: true, lean: true }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Stats sync failed" });
  }
});

export default router;