import { v2 as cloudinary } from 'cloudinary';
import Post from '../models/Post.js';
import User from '../models/User.js';

// Cloudinary কনফিগারেশন (Environment variables থেকে ডেটা নিশ্চিত করুন)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET
});

/* ==========================================================
    ১. পোস্ট তৈরি (Create Post)
    এটিতে Auth0 ID (sub) এবং req.user উভয়ই চেক করা হয়েছে।
========================================================== */
export const createPost = async (req, res) => {
  try {
    const { content, type, text } = req.body; 
    
    // Auth0 (req.auth) অথবা কাস্টম মিডলওয়্যার (req.user) থেকে আইডি নেওয়া
    const currentUserId = req.auth?.payload?.sub || req.user?.sub || req.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({ msg: "Neural Identity missing! Unauthorized." });
    }

    let mediaUrl = "";
    let publicId = "";

    // মিডিয়া আপলোড (Image/Video)
    if (req.file) {
      const resourceType = type === 'video' ? 'video' : 'auto'; // 'auto' দিলে সব টাইপ হ্যান্ডেল হয়
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        resource_type: resourceType,
        folder: "onyx_drift_media",
      });
      mediaUrl = uploadRes.secure_url;
      publicId = uploadRes.public_id;
    }

    // ইউজারের প্রোফাইল ডাটাবেস থেকে ফেচ করা
    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    const newPost = new Post({
      authorAuth0Id: currentUserId, 
      authorId: currentUserId,
      author: currentUserId, // অতিরিক্ত ব্যাকআপের জন্য
      authorName: userProfile?.name || req.user?.name || "Unknown Drifter",
      authorAvatar: userProfile?.avatar || req.user?.picture || "",
      text: content || text,
      content: content || text,
      media: mediaUrl,
      mediaUrl: mediaUrl,
      mediaType: type || 'photo',
      publicId: publicId,
      postType: type === 'video' ? 'reels' : 'post',
      likes: [],
      comments: [],
      views: 0
    });

    const savedPost = await newPost.save();
    console.log(`[Signal Sent]: Post created by ${currentUserId}`);
    res.status(201).json(savedPost);

  } catch (err) {
    console.error("❌ Neural Upload Error:", err);
    res.status(500).json({ msg: "Neural Upload Failed", error: err.message });
  }
};

/* ==========================================================
    ২. লাইক/আনলাইক লজিক
========================================================== */
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.auth?.payload?.sub || req.user?.sub || req.user?.id;
    if (!userId) return res.status(401).json({ msg: "Neural Link required" });

    // নিশ্চিত করা যে likes একটি অ্যারে
    if (!Array.isArray(post.likes)) post.likes = [];

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error("❌ Like Action Error:", err);
    res.status(500).json({ msg: "Neural Pulse Interrupted" });
  }
};

/* ==========================================================
    ৩. রিলস ফেচ (Viral Algorithm)
========================================================== */
export const getReels = async (req, res) => {
  try {
    const reels = await Post.aggregate([
      { 
        $match: { 
          $or: [
            { postType: 'reels' }, 
            { mediaType: 'video' },
            { mediaType: 'reel' }
          ] 
        } 
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          algoScore: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $multiply: [{ $ifNull: ["$views", 0] }, 0.1] } // ভিউজকেও র‍্যাঙ্কে যুক্ত করা
            ]
          }
        }
      },
      { $sort: { algoScore: -1, createdAt: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json(reels);
  } catch (err) {
    console.error("❌ Neural Reels Fetch Error:", err);
    res.status(500).json({ msg: "Failed to fetch neural reels" });
  }
};

/* ==========================================================
    ৪. রিলস ভিউ আপডেট (Pulse Update)
========================================================== */
export const updateReelPulse = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPost = await Post.findByIdAndUpdate(
            id, 
            { $inc: { views: 1 } }, 
            { new: true }
        );
        res.status(200).json({ msg: "Pulse updated", views: updatedPost?.views });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ==========================================================
    ৫. রিলস আপলোড
========================================================== */
export const createReel = async (req, res) => {
  req.body.type = 'video';
  return createPost(req, res);
};