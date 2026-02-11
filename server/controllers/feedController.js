import Post from "../models/Post.js";
import User from "../models/User.js";

/**
 * 🧠 GET NEURAL FEED
 * ইউজারের মুড, স্কিল এবং সোশ্যাল কানেকশনের ওপর ভিত্তি করে পার্সোনালাইজড ফিড জেনারেট করে।
 */
export const getNeuralFeed = async (req, res) => {
  try {
    // ১. ইউজার ডিটেকশন (Safe Auth Check)
    // req.auth (Auth0 middleware থেকে আসে) অথবা req.user চেক করা হচ্ছে
    const auth0Id = req.auth?.payload?.sub || req.user?.sub || req.user?.id;

    if (!auth0Id) {
      console.log("⚠️ Auth0 ID missing in request");
      return res.status(401).json({ msg: "Neural Identity missing. Please login." });
    }

    // ইউজার খোঁজা
    const user = await User.findOne({ auth0Id }).lean();
    if (!user) {
      console.log(`⚠️ User ${auth0Id} not found in DB`);
      return res.status(404).json({ msg: "User not detected in Neural Grid" });
    }

    // ২. ইউজারের মুড এবং টপ স্কিল বের করা (Safe Access with Default Values)
    const currentMood = (user.moodHistory && user.moodHistory.length > 0) 
      ? user.moodHistory[user.moodHistory.length - 1]?.mood 
      : "neutral";
    
    const topSkill = (user.detectedSkills && user.detectedSkills.length > 0) 
      ? user.detectedSkills[0]?.name 
      : "Cyber-Void";

    // ৩. অ্যাডভান্সড কুয়েরি লজিক
    const followingList = Array.isArray(user.following) ? user.following : [];

    // কুয়েরি রান করা
    let feedPosts = await Post.find({
      $or: [
        { isAiGenerated: true }, 
        { authorAuth0Id: { $in: followingList } }, 
        { authorId: { $in: followingList } },
        { text: { $regex: String(topSkill), $options: 'i' } } 
      ]
    })
    .sort({ createdAt: -1 })
    .limit(100) // একটু বেশি পোস্ট নিয়ে পরে শর্টিং করা ভালো
    .lean();

    if (!feedPosts || feedPosts.length === 0) {
      return res.status(200).json([]);
    }

    // ৪. "Resonance Ranking" - এলগরিদম (Adding Try-Catch inside map for safety)
    const scoredPosts = feedPosts.map(post => {
      let resonanceScore = 0;

      try {
        // মুড ম্যাচিং (Safe string check)
        if (post.aiPersona && currentMood && 
            typeof post.aiPersona === 'string' &&
            post.aiPersona.toLowerCase().includes(currentMood.toLowerCase())) {
          resonanceScore += 50;
        }

        // এআই জেনারেটেড পোস্ট বোনাস
        if (post.isAiGenerated) {
          resonanceScore += 30;
        }

        // এনগেজমেন্ট বোনাস (Safe Array Check)
        const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        const viewsCount = Number(post.views) || 0;
        resonanceScore += (likesCount * 2) + (viewsCount * 0.5);

        // ফলোয়িং বোনাস
        if (followingList.includes(post.authorAuth0Id) || followingList.includes(post.authorId)) {
          resonanceScore += 25;
        }
      } catch (innerErr) {
        console.error("Score Calc Error for post:", post._id, innerErr.message);
      }

      return { ...post, resonanceScore };
    });

    // ৫. Resonance Score অনুযায়ী শর্টিং (High to Low)
    scoredPosts.sort((a, b) => (b.resonanceScore || 0) - (a.resonanceScore || 0));

    // ৬. ফাইনাল রেসপন্স (সবচেয়ে প্রাসঙ্গিক ৫০টি পোস্ট)
    res.status(200).json(scoredPosts.slice(0, 50));

  } catch (err) {
    // এটি রেন্ডার লগে স্পষ্ট করে দেখাবে ভুলটা কোথায়
    console.error("❌ CRITICAL FEED ERROR:", err.stack);
    res.status(500).json({ 
      error: "Neural Grid Breakdown", 
      message: err.message 
    });
  }
};