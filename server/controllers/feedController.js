import Post from "../models/Post.js";
import User from "../models/User.js";

export const getNeuralFeed = async (req, res) => {
  try {
    // ১. ইউজার ডিটেকশন
    const auth0Id = req.auth?.payload?.sub || req.user?.sub || req.user?.id;

    if (!auth0Id) {
      return res.status(401).json({ msg: "Neural Identity missing. Please login." });
    }

    const user = await User.findOne({ auth0Id }).lean();
    
    // ডিফল্ট ভ্যালু
    const followingList = user?.following && Array.isArray(user.following) ? user.following : [];
    const currentMood = user?.moodHistory?.length > 0 
      ? user.moodHistory[user.moodHistory.length - 1]?.mood 
      : "neutral";
    const topSkill = user?.detectedSkills?.length > 0 
      ? user.detectedSkills[0]?.name 
      : "";

    // ২. 🧠 স্মার্ট কুয়েরি লজিক (AI + User Posts)
    // এখানে কোনো ফিল্টার রাখা হয়নি, ডাটাবেসের সব পোস্ট আসবে।
    // ফলো করা ইউজারদের পোস্ট বা নিজের পোস্টগুলো সবার আগে দেখানোর জন্য রেটিং লজিক কাজ করবে।
    let feedPosts = await Post.find({})
      .sort({ createdAt: -1 }) // সর্বশেষ পোস্ট আগে আসবে
      .limit(100)
      .lean();

    if (!feedPosts || feedPosts.length === 0) {
      return res.status(200).json([]);
    }

    // ৩. 📊 "Resonance Ranking" - এলগরিদম (সব পোস্টের ওপর রেটিং)
    const scoredPosts = feedPosts.map(post => {
      let resonanceScore = 0;

      try {
        // --- রেটিং নিয়মাবলি ---

        // ক) AI পোস্ট বোনাস (+30)
        if (post.isAiGenerated) {
          resonanceScore += 30;
        }

        // খ) ফলোয়িং বা নিজের পোস্ট বোনাস (+40)
        if (followingList.includes(post.authorAuth0Id) || post.authorAuth0Id === auth0Id) {
          resonanceScore += 40;
        }

        // গ) মুড ম্যাচিং বোনাস (+50)
        if (post.aiPersona && currentMood && 
            typeof post.aiPersona === 'string' &&
            post.aiPersona.toLowerCase().includes(currentMood.toLowerCase())) {
          resonanceScore += 50;
        }

        // ঘ) এনগেজমেন্ট স্কোর (লাইক/ভিউ)
        const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        const viewsCount = Number(post.views) || 0;
        resonanceScore += (likesCount * 3) + (viewsCount * 0.5);

      } catch (innerErr) {
        console.error("Score Calc Error:", post._id, innerErr.message);
      }

      return { ...post, resonanceScore };
    });

    // ৪. Resonance Score অনুযায়ী শর্টিং (High to Low)
    scoredPosts.sort((a, b) => (b.resonanceScore || 0) - (a.resonanceScore || 0));

    // ৫. ফাইনাল রেসপন্স (সবচেয়ে প্রাসঙ্গিক ৫০টি পোস্ট)
    res.status(200).json(scoredPosts.slice(0, 50));

  } catch (err) {
    console.error("❌ CRITICAL FEED ERROR:", err.stack);
    res.status(500).json({ 
      error: "Neural Grid Breakdown", 
      message: err.message 
    });
  }
};