import Post from "../models/Post.js";
import User from "../models/User.js";

export const getNeuralFeed = async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) return res.status(404).json({ msg: "User not detected in Neural Grid" });

    // ১. ইউজারের বর্তমান মুড এবং টপ স্কিল বের করা
    const currentMood = user.moodHistory?.slice(-1)[0]?.mood || "neutral";
    const topSkill = user.detectedSkills?.[0]?.name || "Cyber-Void";

    // ২. অ্যাডভান্সড কুয়েরি লজিক
    // ইউজারের মুডের সাথে মিল আছে এমন পোস্টগুলোকে প্রায়োরিটি দেওয়া
    let feedPosts = await Post.find({
      $or: [
        { isAiGenerated: true }, // AI পোস্ট সবসময় ইনজেক্ট করা হবে
        { authorAuth0Id: { $in: user.following } }, // ফ্রেন্ডদের পোস্ট
        { text: { $regex: topSkill, $options: 'i' } } // ইউজারের স্কিল রিলেটেড গ্লোবাল পোস্ট
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    // ৩. "Resonance Ranking" - ১০০ বছরের সিক্রেট লজিক
    feedPosts = feedPosts.map(post => {
      let resonanceScore = 0;

      // মুড ম্যাচিং (মুড মিলে গেলে স্কোর বাড়বে)
      if (post.aiPersona && post.aiPersona.toLowerCase().includes(currentMood)) {
        resonanceScore += 50;
      }

      // এআই শ্যাডো ইন্টিগ্রেশন (এআই জেনারেটেড হলে এক্সট্রা গ্লো)
      if (post.isAiGenerated) resonanceScore += 30;

      // পপুলারিটি এবং ভিউজ
      resonanceScore += (post.likes.length * 2) + (post.views * 0.5);

      return { ...post, resonanceScore };
    });

    // স্কোর অনুযায়ী শর্টিং
    feedPosts.sort((a, b) => b.resonanceScore - a.resonanceScore);

    res.json(feedPosts);
  } catch (err) {
    console.error("Neural Feed Collapse:", err);
    res.status(500).json({ msg: "Feed Synchronization Failed" });
  }
};