import { v2 as cloudinary } from 'cloudinary';
import Post from '../models/Post.js';
import User from '../models/User.js';

// Cloudinary কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// ১. পোস্ট তৈরি (Create Post)
export const createPost = async (req, res) => {
  try {
    const { content, type } = req.body; 
    const currentUserId = req.user.sub || req.user.id; 
    
    let mediaUrl = "";
    let publicId = "";

    if (req.file) {
      const resourceType = type === 'video' ? 'video' : 'image';
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        resource_type: resourceType,
        folder: "onyx_drift_media",
      });
      mediaUrl = uploadRes.secure_url;
      publicId = uploadRes.public_id;
    }

    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    const newPost = new Post({
      authorAuth0Id: currentUserId, 
      authorId: currentUserId,
      authorName: userProfile?.name || req.user.name || "Unknown Drifter",
      authorAvatar: userProfile?.avatar || req.user.picture || "",
      text: content,
      content: content,
      media: mediaUrl,
      mediaUrl: mediaUrl,
      mediaType: type || 'photo',
      publicId: publicId,
      postType: type === 'video' ? 'reels' : 'post',
      likes: [] // ডিফল্ট খালি অ্যারে নিশ্চিত করা
    });

    await newPost.save();
    console.log(`[Post Created]: Signal transmitted by ${currentUserId}`);
    res.status(201).json(newPost);

  } catch (err) {
    console.error("Neural Upload Error:", err);
    res.status(500).json({ msg: "Neural Upload Failed" });
  }
};

// ২. লাইক/আনলাইক লজিক (এটি আপনার এরর ফিক্স করবে)
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.sub || req.user.id;

    // নিশ্চিত করা যে likes একটি অ্যারে
    if (!post.likes) post.likes = [];

    if (post.likes.includes(userId)) {
      // আগেই লাইক থাকলে রিমুভ (Unlike)
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      // লাইক না থাকলে অ্যাড (Like)
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error("Like Action Error:", err);
    res.status(500).json({ msg: "Neural Pulse Interrupted" });
  }
};

// ৩. রিলস ফেচ (Viral Algorithm)
export const getReels = async (req, res) => {
  try {
    const reels = await Post.aggregate([
      { 
        $match: { 
          $or: [
            { postType: 'reels' }, 
            { mediaType: 'video' }
          ] 
        } 
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          algoScore: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $divide: [1, { $add: [{ $subtract: [new Date(), "$createdAt"] }, 1] }] }
            ]
          }
        }
      },
      { $sort: { algoScore: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json(reels);
  } catch (err) {
    console.error("Neural Reels Fetch Error:", err);
    res.status(500).json({ msg: "Failed to fetch neural reels" });
  }
};

// ৪. রিলস ভিউ আপডেট (Pulse Update)
export const updateReelPulse = async (req, res) => {
    try {
        const { id } = req.params;
        await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });
        res.status(200).json({ msg: "Pulse updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ৫. রিলস আপলোড
export const createReel = async (req, res) => {
  req.body.type = 'video';
  return createPost(req, res);
};