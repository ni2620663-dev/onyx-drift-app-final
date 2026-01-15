import express from "express";
const router = express.Router();
import Story from "../models/Story.js";

// ১. স্টোরি পোস্ট করা (মেসেঞ্জারের জন্য)
router.post("/", async (req, res) => {
  // ফ্রন্টএন্ড থেকে আসা বডি এবং ডিফল্ট অনলি মেসেঞ্জার সেট করা
  const newStory = new Story({
    ...req.body,
    onlyMessenger: req.body.onlyMessenger || "true" // যদি না পাঠানো হয় তবে "true" হিসেবে সেভ হবে
  });

  try {
    const savedStory = await newStory.save();
    res.status(200).json(savedStory);
  } catch (err) {
    res.status(500).json({ message: "Post failed", error: err });
  }
});

// ২. সব স্টোরি গেট করা (শুধুমাত্র মেসেঞ্জারের গুলো দেখাবে)
router.get("/", async (req, res) => {
  try {
    // শুধুমাত্র "true" স্টোরিগুলো ফিল্টার করে আনা হচ্ছে
    const stories = await Story.find({ onlyMessenger: "true" })
      .sort({ createdAt: -1 });
      
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err });
  }
});

export default router;