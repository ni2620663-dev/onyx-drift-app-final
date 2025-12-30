import express from "express";
import Video from "../models/Video.js";
const router = express.Router();

// সব ভিডিও পাওয়ার জন্য
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json(err);
  }
});

// নতুন ভিডিও আপলোড করার জন্য
router.post("/upload", async (req, res) => {
  const newVideo = new Video(req.body);
  try {
    const savedVideo = await newVideo.save();
    res.status(200).json(savedVideo);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;