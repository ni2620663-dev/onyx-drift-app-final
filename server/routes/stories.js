import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Story from "../models/Story.js";

const router = express.Router();

// ১. ক্লাউডিনারি কনফিগারেশন (আপনার ডাটা দিয়ে আপডেট করুন অথবা .env থেকে নিন)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ২. মাল্টার স্টোরেজ সেটআপ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "messenger_stories",
    allowed_formats: ["jpg", "png", "jpeg", "gif"],
  },
});

const upload = multer({ storage: storage });

// --- এপিআই রাউটস ---

// ১. স্টোরি পোস্ট করা (মেসেঞ্জারের জন্য)
// এখানে upload.single("media") যুক্ত করা হয়েছে যা ফাইল রিসিভ করবে
router.post("/", upload.single("media"), async (req, res) => {
  try {
    // ফাইল যদি আপলোড হয় তবে ক্লাউডিনারি থেকে আসা URL ব্যবহার হবে
    const mediaUrl = req.file ? req.file.path : req.body.mediaUrl;

    if (!mediaUrl) {
      return res.status(400).json({ message: "Media file or URL is required" });
    }

    const newStory = new Story({
      userId: req.body.userId,
      mediaUrl: mediaUrl,
      text: req.body.text,
      musicName: req.body.musicName,
      musicUrl: req.body.musicUrl,
      filter: req.body.filter,
      onlyMessenger: req.body.onlyMessenger || "true"
    });

    const savedStory = await newStory.save();
    res.status(200).json(savedStory);
  } catch (err) {
    console.error("Story Post Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ২. সব স্টোরি গেট করা (শুধুমাত্র মেসেঞ্জার ফিল্টারসহ)
router.get("/", async (req, res) => {
  try {
    const stories = await Story.find({ onlyMessenger: "true" })
      .sort({ createdAt: -1 });
      
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

export default router;