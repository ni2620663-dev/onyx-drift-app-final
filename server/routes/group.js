import express from 'express';
import Group from '../models/Group.js';
import Message from '../models/Message.js';

const router = express.Router();

/**
 * ১. নতুন গ্রুপ (Hive) তৈরি করা
 * ফ্রন্টএন্ড থেকে আসে: { name: "Group Name" }
 */
router.post('/create', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Auth0 বা কাস্টম মিডলওয়্যার থেকে ইউজার আইডি পাওয়ার ইউনিভার্সাল পদ্ধতি
    const creatorId = req.auth?.payload?.sub || req.user?.sub;

    if (!creatorId) {
      return res.status(401).json({ message: "Identity signal lost: Unauthorized" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Hive name is required" });
    }

    const newGroup = new Group({
      name: name.trim(),
      creator: creatorId,
      members: [creatorId], // মেকার নিজে প্রথম মেম্বার
      isPublic: true,
      avatar: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&bold=true&name=${encodeURIComponent(name)}`
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    console.error("❌ Hive Creation Error:", err.message);
    res.status(500).json({ message: "Hive creation failed", error: err.message });
  }
});

/**
 * ২. সব গ্রুপ লিস্ট দেখা (Discovery)
 */
router.get('/', async (req, res) => {
  try {
    // সব গ্রুপ নিয়ে আসবে এবং মেম্বার সংখ্যা কাউন্ট করার জন্য ডাটা দিবে
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Discovery signal lost", error: err.message });
  }
});

/**
 * ৩. নির্দিষ্ট গ্রুপের চ্যাট হিস্ট্রি আনা
 */
router.get('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // নির্দিষ্ট গ্রুপের মেসেজগুলো টাইমলাইন অনুযায়ী সর্ট করে আনা
    const messages = await Message.find({ 
      conversationId: groupId,
      isGroup: true 
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    console.error("❌ Message Fetch Error:", err.message);
    res.status(500).json({ message: "Neural link broken: Messages fetch failed" });
  }
});

/**
 * ৪. গ্রুপে মেম্বার জয়েন করা (Join Call/Chat)
 */
router.post('/:groupId/join', async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.user?.sub;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Access denied: Missing credentials" });
    }

    // $addToSet নিশ্চিত করে যে একই ইউজার বারবার জয়েন করলেও ডুপ্লিকেট হবে না
    const group = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: userId } },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ message: "Hive not found" });
    }

    res.json({ message: "Successfully linked to hive", group });
  } catch (err) {
    res.status(500).json({ message: "Link failure", error: err.message });
  }
});

export default router;