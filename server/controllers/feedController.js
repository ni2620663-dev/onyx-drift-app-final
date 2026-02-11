import Post from "../models/Post.js";
import User from "../models/User.js";

/**
 * 🧠 GET NEURAL FEED
 * ইউজারের মুড, স্কিল এবং সোশ্যাল কানেকশনের ওপর ভিত্তি করে পার্সোনালাইজড ফিড জেনারেট করে।
 */
export const getNeuralFeed = async (req, res) => {
  try {
    // ১. ইউজার ডিটেকশন (Auth0 ID চেক)
    // মিডলওয়্যারভেদে sub আইডি req.auth অথবা req.user এ থাকতে পারে
    const auth0Id = req.auth?.payload?.sub || req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ msg: "Neural Identity missing. Please login." });
    }

    const user = await User.findOne({ auth0Id }).lean();
    if (!user) {
      return res.status(404).json({ msg: "User not detected in Neural Grid" });
    }

    // ২. ইউজারের মুড এবং টপ স্কিল বের করা
    const currentMood = user.moodHistory?.length > 0 
      ? user.moodHistory[user.moodHistory.length - 1].mood 
      : "neutral";
    
    const topSkill = user.detectedSkills?.length > 0 
      ? user.detectedSkills[0].name 
      : "Cyber-Void";

    // ৩. অ্যাডভান্সড কুয়েরি লজিক
    // AI পোস্ট, ফ্রেন্ডদের পোস্ট এবং স্কিল রিলেটেড পোস্ট ফেচ করা
    let feedPosts = await Post.find({
      $or: [
        { isAiGenerated: true }, 
        { authorAuth0Id: { $in: user.following || [] } }, 
        { authorId: { $in: user.following || [] } }, // ID ফিল্ডের ভিন্নতা হ্যান্ডেল করতে
        { text: { $regex: topSkill, $options: 'i' } } 
      ]
    })
    .sort({ createdAt: -1 })
    .limit(60) // র‍্যাঙ্কিংয়ের জন্য একটু বেশি ডাটা নেওয়া হলো
    .lean();

    // ৪. "Resonance Ranking" - এলগরিদম
    // 
    feedPosts = feedPosts.map(post => {
      let resonanceScore = 0;

      // মুড ম্যাচিং (Mood Consistency Bonus)
      if (post.aiPersona && currentMood && post.aiPersona.toLowerCase().includes(currentMood.toLowerCase())) {
        resonanceScore += 50;
      }

      // এআই শ্যাডো ইন্টিগ্রেশন
      if (post.isAiGenerated) {
        resonanceScore += 30;
      }

      // পপুলারিটি এবং এনগেজমেন্ট ক্যালকুলেশন
      const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
      const viewsCount = post.views || 0;
      resonanceScore += (likesCount * 2) + (viewsCount * 0.5);

      // ফ্রেন্ডস বোনাস (যদি পোস্টটি ফলোয়িং লিস্টের কারো হয়)
      if (user.following?.includes(post.authorAuth0Id)) {
        resonanceScore += 20;
      }

      return { ...post, resonanceScore };
    });

    // ৫. Resonance Score অনুযায়ী শর্টিং (High to Low)
    feedPosts.sort((a, b) => b.resonanceScore - a.resonanceScore);

    // ৬. ফাইনাল রেসপন্স (সবচেয়ে প্রাসঙ্গিক ৫০টি পোস্ট)
    res.status(200).json(feedPosts.slice(0, 50));

  } catch (err) {
    console.error("❌ Neural Feed Collapse:", err);
    res.status(500).json({ 
      msg: "Feed Synchronization Failed", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};