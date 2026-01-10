import { v2 as cloudinary } from 'cloudinary';
import Post from '../models/Post.js';
import User from '../models/User.js'; // ইউজার ইনফো আনার জন্য প্রয়োজন

// Cloudinary কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

export const createPost = async (req, res) => {
  try {
    const { content, type } = req.body; 
    const currentUserId = req.user.sub || req.user.id; // Auth0 আইডি নিশ্চিত করা
    
    let mediaUrl = "";
    let publicId = "";

    // ১. মিডিয়া আপলোড লজিক
    if (req.file) {
      const resourceType = type === 'video' ? 'video' : 'image';
      
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        resource_type: resourceType,
        folder: "onyx_drift_media",
      });
      
      mediaUrl = uploadRes.secure_url;
      publicId = uploadRes.public_id;
    }

    // ২. ইউজার প্রোফাইল থেকে নাম ও অবতার সংগ্রহ (ঐচ্ছিক কিন্তু ভালো)
    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    // ৩. নতুন পোস্ট অবজেক্ট (আইডি ম্যাপিং ফিক্সড)
    const newPost = new Post({
      // আপনার userRoutes-এর সার্চের সাথে মিল রেখে এই ফিল্ডগুলো সেট করা হয়েছে
      authorAuth0Id: currentUserId, 
      authorId: currentUserId,
      authorName: userProfile?.name || req.user.name || "Unknown Drifter",
      authorAvatar: userProfile?.avatar || req.user.picture || "",
      
      // কন্টেন্ট এবং মিডিয়া
      text: content, // মডেলে 'text' থাকলে এটি ব্যবহার করুন
      content: content, // মডেলে 'content' থাকলে এটিও থাকলো
      media: mediaUrl,
      mediaUrl: mediaUrl,
      mediaType: type || 'photo',
      publicId: publicId
    });

    // ৪. ডাটাবেসে সেভ করা
    await newPost.save();
    
    console.log(`[Post Created]: Signal transmitted by ${currentUserId}`);
    res.status(201).json(newPost);

  } catch (err) {
    console.error("Neural Upload Error:", err);
    res.status(500).json({ msg: "Neural Upload Failed" });
  }
};