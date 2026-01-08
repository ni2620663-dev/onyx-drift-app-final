import express from "express";
import auth from "../middleware/auth.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

/* =========================
   Cloudinary Storage Configuration
========================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "onyx_drift_posts",
    resource_type: "auto",
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "webm"],
  },
});

const upload = multer({ storage });

/* =========================
   1️⃣ Get All Posts (Global Feed)
   Endpoint: GET /api/posts
========================= */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

/* =========================
   2️⃣ Create Post (FIXED ROUTE)
   Endpoint: POST /api/posts
========================= */
// এখানে "/create" এর বদলে শুধু "/" দেওয়া হয়েছে যাতে ফ্রন্টএন্ড থেকে সরাসরি /api/posts এ হিট করা যায়
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    const { text, mediaType, authorName, authorAvatar } = req.body;

    const post = await Post.create({
      text,
      media: req.file?.path || null,
      mediaType: mediaType || (req.file?.mimetype?.includes("video") ? "video" : "image"),
      authorName: authorName || "Unknown Drifter",
      authorAvatar: authorAvatar || "",
      author: req.user.id, // Auth middleware থেকে আসা আইডি
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Post Creation Error:", err);
    res.status(500).json({ msg: "Transmission failed", error: err.message });
  }
});

/* =========================
   3️⃣ Get User Specific Posts
   Endpoint: GET /api/posts/user/:userId
========================= */
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const decodedId = decodeURIComponent(req.params.userId);
    const posts = await Post.find({ author: decodedId })
      .sort({ createdAt: -1 });

    res.json(posts || []);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch user posts" });
  }
});

/* =========================
   4️⃣ Like / Unlike Logic
   Endpoint: PUT /api/posts/:id/like
========================= */
router.put("/:id/like", auth, async (req, res) => {
  try {
    const userId = req.user.id;
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

/* =========================
   5️⃣ Delete Post
   Endpoint: DELETE /api/posts/:id
========================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    // চেক করা হচ্ছে যে ডিলিট করছে সে-ই পোস্টের মালিক কি না
    if (post.author !== req.user.id)
      return res.status(401).json({ msg: "Unauthorized" });

    await post.deleteOne();
    res.json({ msg: "Post terminated", postId: req.params.id });
  } catch (err) {
    res.status(500).json({ msg: "Delete failed" });
  }
});

/* =========================
   6️⃣ Friend Requests Logic (Signals)
========================= */
router.post("/friend-request/:targetUserId", auth, async (req, res) => {
  const senderId = req.user.id;
  const { targetUserId } = req.params;

  if (senderId === targetUserId)
    return res.status(400).json({ msg: "Cannot add yourself" });

  await User.updateOne(
    { auth0Id: targetUserId }, 
    { $addToSet: { friendRequests: senderId } }
  );

  res.json({ msg: "Signal sent successfully" });
});

router.post("/friend-accept/:senderId", auth, async (req, res) => {
  const receiverId = req.user.id;
  const senderId = req.params.senderId;

  await Promise.all([
    User.updateOne(
      { auth0Id: receiverId },
      { $pull: { friendRequests: senderId }, $addToSet: { friends: senderId } }
    ),
    User.updateOne(
      { auth0Id: senderId },
      { $addToSet: { friends: receiverId } }
    ),
  ]);

  res.json({ msg: "Neural Link Established!" });
});

export default router;