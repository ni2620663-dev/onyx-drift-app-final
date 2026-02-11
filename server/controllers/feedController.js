import Post from "../models/Post.js";
import User from "../models/User.js";

/**
 * 🧠 GET NEURAL FEED
 * ইউজারের মুড, স্কিল এবং সোশ্যাল কানেকশনের ওপর ভিত্তি করে পার্সোনালাইজড ফিড জেনারেট করে।
 */
export const getNeuralFeed = async (req, res) => {
  try {
    // ১. ইউজার ডিটেকশন (Safe Auth Check)
    const auth0Id = req.auth?.payload?.sub || req.user?.sub || req.user?.id;

    if (!auth0Id) {
      return res.status(401).json({ msg: "Neural Identity missing. Please login." });
    }

    const user = await User.findOne({ auth0Id }).lean();
    if (!user) {
      return res.status(404).json({ msg: "User not detected in Neural Grid" });
    }

    // ২. ইউজারের মুড এবং টপ স্কিল বের করা (Safe Access)
    const currentMood = (user.moodHistory && user.moodHistory.length > 0) 
      ? user.moodHistory[user.moodHistory.length - 1].mood 
      : "neutral";
    
    const topSkill = (user.detectedSkills && user.detectedSkills.length > 0) 
      ? user.detectedSkills[0].name 
      : "Cyber-Void";

    // ৩. অ্যাডভান্সড কুয়েরি লজিক
    // ইউজারের ফলোয়িং লিস্ট এবং স্কিল ভিত্তিক পোস্ট খোঁজা
    const followingList = Array.isArray(user.following) ? user.following : [];

    let feedPosts = await Post.find({
      $or: [
        { isAiGenerated: true }, 
        { authorAuth0Id: { $in: followingList } }, 
        { authorId: { $in: followingList } },
        { text: { $regex: topSkill, $options: 'i' } } 
      ]
    })
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

    // ৪. "Resonance Ranking" - এলগরিদম
    feedPosts = feedPosts.map(post => {
      let resonanceScore = 0;

      // মুড ম্যাচিং (Mood Consistency Bonus)
      if (post.aiPersona && currentMood && 
          post.aiPersona.toLowerCase().includes(currentMood.toLowerCase())) {
        resonanceScore += 50;
      }

      // এআই শ্যাডো ইন্টিগ্রেশন
      if (post.isAiGenerated) {
        resonanceScore += 30;
      }

      // পপুলারিটি এবং এনগেজমেন্ট ক্যালকুলেশন (Safe Likes Check)
      const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
      const viewsCount = post.views || 0;
      resonanceScore += (likesCount * 2) + (viewsCount * 0.5);

      // ফ্রেন্ডস বোনাস
      if (followingList.includes(post.authorAuth0Id) || followingList.includes(post.authorId)) {
        resonanceScore += 25;
      }

      return { ...post, resonanceScore };
    });

    // ৫. Resonance Score অনুযায়ী শর্টিং (High to Low)
    feedPosts.sort((a, b) => b.resonanceScore - a.resonanceScore);

    // ৬. ফাইনাল রেসপন্স (সবচেয়ে প্রাসঙ্গিক ৫০টি পোস্ট)
    res.status(200).json(feedPosts.slice(0, 50));

  } catch (err) {
    console.error("❌ Neural Feed Collapse:", err);
    res.status(500).json({ 
      msg: "Feed Synchronization Failed", 
      error: err.message 
    });
  }
};