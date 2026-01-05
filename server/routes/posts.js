import express from 'express';
import auth from '../middleware/auth.js'; // আপনার Auth Middleware
import Post from '../models/Post.js';
import User from '../models/User.js'; // ফ্রেন্ড লজিকের জন্য প্রয়োজন
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// --- ক্লাউডিনারি স্টোরেজ সেটআপ ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'onyx_drift_posts',
    resource_type: "auto", 
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'webm']
  }
});
const upload = multer({ storage: storage });

// ১. সব পোস্ট গেট করা (Public)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ২. নির্দিষ্ট ইউজারের পোস্ট দেখা
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId }).sort({ createdAt: -1 });
    res.json(posts || []);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ৩. নতুন পোস্ট তৈরি (Upload সহ)
router.post('/create', auth, upload.single('media'), async (req, res) => {
  try {
    const { text, mediaType, authorName, authorAvatar } = req.body;
    
    const newPost = new Post({
      text,
      media: req.file ? req.file.path : null, 
      mediaType: mediaType || (req.file ? (req.file.mimetype.includes('video') ? 'video' : 'image') : 'text'),
      authorName,
      authorAvatar,
      author: req.user.id, // আপনার মিডলওয়্যারে req.user.id থাকতে হবে
      likes: [],
      comments: []
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error("Create Post Error:", err);
    res.status(500).json({ msg: 'Transmission Failed', error: err.message });
  }
});

// ৪. পোস্ট ডিলিট করা
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    // চেক করা হচ্ছে মালিক কি না (author field check)
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Unauthorized! You can only delete your own posts." });
    }

    await post.deleteOne();
    res.json({ msg: "Post deleted successfully", postId: req.params.id });
  } catch (err) {
    res.status(500).json({ msg: "Delete failed", error: err.message });
  }
});

// ৫. পোস্ট লাইক/আনলাইক করা (Fixes 404 Error)
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.id;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FRIEND SYSTEM (Send & Accept) ---

// ৬. ফ্রেন্ড রিকোয়েস্ট পাঠানো
router.post('/friend-request/:targetUserId', auth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { targetUserId } = req.params;

    if (senderId === targetUserId) return res.status(400).json({ msg: "Cannot add yourself" });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ msg: "User not found" });

    if (targetUser.friendRequests.includes(senderId)) {
      return res.status(400).json({ msg: "Request already sent" });
    }

    targetUser.friendRequests.push(senderId);
    await targetUser.save();
    res.json({ msg: "Friend Request Sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৭. ফ্রেন্ড রিকোয়েস্ট এক্সেপ্ট করা
router.post('/friend-accept/:senderId', auth, async (req, res) => {
  try {
    const receiverId = req.user.id;
    const senderId = req.params.senderId;

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender) return res.status(404).json({ msg: "User not found" });

    // রিকোয়েস্ট লিস্ট থেকে সরানো
    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);

    // ফ্রেন্ড লিস্টে অ্যাড করা (ডুপ্লিকেট এড়াতে check)
    if (!receiver.friends.includes(senderId)) receiver.friends.push(senderId);
    if (!sender.friends.includes(receiverId)) sender.friends.push(receiverId);

    await receiver.save();
    await sender.save();

    res.json({ msg: "Connection Established!", friends: receiver.friends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;