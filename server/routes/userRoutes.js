import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js'; 
import User from '../models/User.js';
import { createPost } from '../controllers/postController.js';

const router = express.Router();

/* ==========================================================
    ⚙️ MULTER CONFIGURATION (Cloudinary/Disk Storage)
========================================================== */
const storage = multer.diskStorage({});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } 
});

/* ==========================================================
    🚀 ROUTES
========================================================== */

// ১. নতুন পোস্ট তৈরি (Controller-এর মাধ্যমে)
router.post('/create', auth, upload.single('file'), createPost);

/**
 * ২. নির্দিষ্ট ইউজারের সব পোস্ট পাওয়া (Neural Discovery Link)
 * এন্ডপয়েন্ট: GET /api/user/user/:userId
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // URL থেকে আসা আইডি ডিকোড করা (যেমন: google-oauth2|...)
    const targetId = decodeURIComponent(req.params.userId);
    
    /**
     * ডাটাবেসে মাল্টিপল ফিল্ড চেক করা হচ্ছে যাতে 
     * আপনার আগের এবং বর্তমান সব পোস্ট খুঁজে পাওয়া যায়।
     */
    const posts = await Post.find({ 
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { author: targetId }
      ]
    })
    .sort({ createdAt: -1 })
    .lean(); // পারফরম্যান্স অপটিমাইজেশনের জন্য

    console.log(`[Neural Link]: Found ${posts.length} signals for Identity: ${targetId}`);
    
    // পোস্ট না পাওয়া গেলেও খালি অ্যারে [] রিটার্ন করবে (Error নয়)
    res.json(posts);
  } catch (err) {
    console.error("Neural Fetch Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Neural Link Error: Could not synchronize signals." 
    });
  }
});

/**
 * ৩. ড্রিপ্টারের প্রোফাইল ডাটা পাওয়া (Discovery Card-এর জন্য)
 */
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const targetId = decodeURIComponent(req.params.userId);
    const user = await User.findOne({ auth0Id: targetId }).lean();

    if (!user) {
      return res.status(404).json({ message: "Identity not found in database." });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal Neural Error" });
  }
});

export default router;