import express from 'express';
import auth from '../middleware/auth.js'; 
import Post from '../models/Post.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// ১. Cloudinary কনফিগারেশন (ভিডিও এবং ফটোর জন্য auto রিসোর্স টাইপ সেট করা হয়েছে)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ২. Multer Storage সেটআপ (ফটো, ভিডিও এবং রিলস সাপোর্ট করার জন্য)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'onyx_drift_posts',
    resource_type: "auto", // এটি ফটো এবং ভিডিও উভয়ই গ্রহণ করবে
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'webm']
  }
});

const upload = multer({ storage: storage });

// --- ৩. সব পোস্ট গেট করা (Global Feed) ---
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Fetch Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- ৪. নির্দিষ্ট ইউজারের সব পোস্ট গেট করা ---
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId }).sort({ createdAt: -1 });
    res.json(posts || []); 
  } catch (err) {
    console.error('User Post Fetch Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- ৫. নতুন পোস্ট তৈরি করা (ফটো, ভিডিও এবং রিলস আপলোড সাপোর্টসহ) ---
// এখানে 'media' ফিল্ডে ফাইল রিসিভ করা হবে
router.post('/create', auth, upload.single('media'), async (req, res) => {
  try {
    const { text, mediaType, authorName, authorAvatar } = req.body;

    const newPost = new Post({
      text,
      media: req.file ? req.file.path : null, // Cloudinary থেকে আসা ফাইল লিঙ্ক
      mediaType: mediaType || (req.file ? (req.file.mimetype.includes('video') ? 'video' : 'image') : 'text'),
      authorName,
      authorAvatar,
      author: req.user.id, 
      likes: [],
      comments: []
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error('Create Post Error:', err.message);
    res.status(500).json({ msg: 'Database save failed', error: err.message });
  }
});

// --- ৬. পোস্ট আপডেট/এডিট করা ---
router.put('/:id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.author !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized to edit this post' });
    }

    const { text, media } = req.body;
    const updatedData = {};
    if (text) updatedData.text = text;
    if (media) updatedData.media = media;

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- ৭. পোস্ট ডিলিট করা ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.author !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Post removed successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- ৮. লাইক বা আনলাইক করা ---
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const likeIndex = post.likes.indexOf(req.user.id);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Like Error:', err.message);
    res.status(500).send('Server error');
  }
});

export default router;