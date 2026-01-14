import express from "express";
import auth from "../middleware/auth.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
/* ==========================================================
    💬 8. ADD COMMENT (POST /api/posts/:id/comment)
========================================================== */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: "Comment text is required" });

    const currentUserId = req.user?.sub || req.user?.id;
    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    const comment = {
      text,
      userId: currentUserId,
      userName: userProfile?.name || "Drifter",
      userAvatar: userProfile?.avatar || "",
      createdAt: new Date()
    };

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    );

    if (!post) return res.status(404).json({ msg: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("Comment Error:", err);
    res.status(500).json({ msg: "Neural Feedback Failure", error: err.message });
  }
});

/* ==========================================================
    ☁️ Cloudinary & Multer Configuration
========================================================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "onyx_drift_posts",
    resource_type: "auto", 
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "webm"],
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } 
});

/* ==========================================================
    🌍 1. GET ALL POSTS (GET /api/posts)
========================================================== */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: "Neural Fetch Failure", error: err.message });
  }
});

/* ==========================================================
    🚀 2. CREATE POST / REEL / STORY (POST /api/posts)
========================================================== */
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No media file detected. Signal lost." });
    }

    const currentUserId = req.user?.sub || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ msg: "Unauthorized: Neural Identity Missing" });
    }

    const userProfile = await User.findOne({ auth0Id: currentUserId }).lean();

    const isVideo = req.file.mimetype ? req.file.mimetype.includes("video") : false;
    let detectedType = isVideo ? "video" : "image";
    
    // --- STORY & REEL DETECTION ---
    if (req.body.isStory === "true") {
      detectedType = "story";
    } else if (req.body.isReel === "true" && isVideo) {
      detectedType = "reel";
    }

    const postData = {
      author: currentUserId, 
      authorAuth0Id: currentUserId,    
      authorName: userProfile?.name || "Drifter",
      authorAvatar: userProfile?.avatar || "",
      text: req.body.text || "",
      media: req.file.path, 
      mediaType: detectedType,
      filter: req.body.filter || "none", // ফিল্টার সেভ করার জন্য
      likes: [],
      comments: [],
      views: 0
    };

    const post = await Post.create(postData);
    res.status(201).json(post);

  } catch (err) {
    console.error("🔥 POST_CREATION_CRASH:", err);
    res.status(500).json({ 
      msg: "Internal Neural Breakdown", 
      error: err.message
    });
  }
});

/* ==========================================================
    🔥 3. REELS ENGINE (GET /api/posts/reels/all)
========================================================== */
router.get("/reels/all", async (req, res) => {
  try {
    const reels = await Post.find({ 
      mediaType: { $in: ["video", "reel"] } 
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(reels);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch neural reels" });
  }
});

/* ==========================================================
    📸 3.5. STORIES ENGINE (GET /api/posts/stories/all)
========================================================== */
router.get("/stories/all", async (req, res) => {
  try {
    // গত ২৪ ঘণ্টার স্টোরি দেখানোর জন্য (অপশনাল)
    // const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Post.find({ mediaType: "story" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(stories);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch neural stories" });
  }
});

/* ==========================================================
    📡 4. THE VIRAL ENGINE (GET /api/posts/viral-feed)
========================================================== */
router.get("/viral-feed", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(50).lean();
    const now = new Date();

    const viralPosts = posts.map((post) => {
      let engagementScore = (post.likes?.length || 0) * 1.5 + (post.comments?.length || 0) * 4;
      const postAgeInHours = (now - new Date(post.createdAt)) / (1000 * 60 * 60);
      const gravity = 1.8;
      const finalScore = engagementScore / Math.pow(postAgeInHours + 2, gravity);
      return { ...post, viralRank: finalScore };
    });

    viralPosts.sort((a, b) => b.viralRank - a.viralRank);
    res.json(viralPosts.slice(0, 20));
  } catch (err) {
    res.status(500).json({ msg: "Neural Uplink Failure", error: err.message });
  }
});

/* ==========================================================
    👤 5. USER SPECIFIC POSTS (GET /api/posts/user/:userId)
========================================================== */
router.get("/user/:userId", async (req, res) => {
  try {
    const decodedId = decodeURIComponent(req.params.userId);
    const posts = await Post.find({
      $or: [{ authorAuth0Id: decodedId }, { author: decodedId }],
    }).sort({ createdAt: -1 }).lean();
    res.json(posts || []);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch user posts" });
  }
});

/* ==========================================================
    ❤️ 6. LIKE / UNLIKE (PUT /api/posts/:id/like)
========================================================== */
router.put("/:id/like", auth, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const isLiked = post.likes.includes(userId);
    const update = isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================
    🗑️ 7. DELETE POST (DELETE /api/posts/:id)
========================================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.sub || req.user.id;
    if (post.authorAuth0Id !== userId && post.author !== userId)
      return res.status(401).json({ msg: "Access Denied" });

    await post.deleteOne();
    res.json({ msg: "Post terminated", postId: req.params.id });
  } catch (err) {
    res.status(500).json({ msg: "Deletion failed" });
  }
});

export default router;