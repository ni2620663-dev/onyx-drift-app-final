import express from 'express';
import Post from '../models/Post.js'; 
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// নির্দিষ্ট ইউজারের পোস্ট এবং প্রোফাইল ডাটা পাওয়া (আপনার আগের কোড)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.userId);
    
    const user = await User.findOne({ auth0Id: targetId }).lean();

    const posts = await Post.find({ 
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { author: targetId }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json({
      user: user || { auth0Id: targetId, name: "Unknown Drifter" },
      posts: posts || []
    });

    console.log(`[Neural Link]: Found ${posts.length} signals for ${targetId}`);
  } catch (err) {
    console.error("Neural Fetch Error:", err);
    res.status(500).json({ msg: "Neural Link Synchronization Error" });
  }
});

// ✅ ফলো করার নতুন রাউট (এটি আপনার রিকোয়েস্ট অনুযায়ী যোগ করা হলো)
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const targetAuth0Id = decodeURIComponent(req.params.id);
    const followerAuth0Id = req.user.sub; // আপনার Auth0 ID (auth মিডলওয়্যার থেকে)

    if (followerAuth0Id === targetAuth0Id) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    // ডাটাবেসে টার্গেট ইউজার এবং বর্তমান ইউজার খুঁজে বের করা
    const targetUser = await User.findOne({ auth0Id: targetAuth0Id });
    const currentUser = await User.findOne({ auth0Id: followerAuth0Id });

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found in system." });
    }

    // অলরেডি ফলো করা আছে কি না চেক
    if (currentUser.following.includes(targetAuth0Id)) {
      return res.status(400).json({ message: "Already established neural link (Following)." });
    }

    // আপডেট লজিক
    currentUser.following.push(targetAuth0Id);
    targetUser.followers.push(followerAuth0Id);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "Neural link established successfully!" });
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ message: "Server connection failed" });
  }
});

export default router;