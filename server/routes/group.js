import express from 'express';
import Group from '../models/Group.js';
import Message from '../models/Message.js'; // গ্রুপ চ্যাট সেভ করার জন্য
// নোট: আপনার server.js এ 'checkJwt' ইম্পোর্ট করা আছে, তাই এখানে 'auth' হিসেবে সেটিই কাজ করবে।
const router = express.Router();

/* ==========================================================
    ১. নতুন গ্রুপ (Hive) তৈরি করা
========================================================== */
router.post('/create', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Auth0 এর জন্য আইডি বের করার সঠিক পদ্ধতি
    const creatorId = req.auth?.payload?.sub || req.user?.sub;

    if (!creatorId) {
      return res.status(401).json({ message: "Identity signal lost: Unauthorized" });
    }

    const newGroup = new Group({
      name,
      creator: creatorId,
      members: [creatorId], // মেকার নিজে প্রথম মেম্বার
      isPublic: true,
      avatar: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(name)}`
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    console.error("❌ Hive Creation Error:", err.message);
    res.status(500).json({ message: "Hive creation failed", error: err.message });
  }
});

/* ==========================================================
    ২. সব গ্রুপ লিস্ট দেখা (Discovery)
========================================================== */
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Discovery signal lost", error: err.message });
  }
});

/* ==========================================================
    ৩. নির্দিষ্ট গ্রুপের চ্যাট হিস্ট্রি আনা
========================================================== */
router.get('/:groupId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversationId: req.params.groupId,
      isGroup: true 
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Neural link broken: Messages fetch failed" });
  }
});

/* ==========================================================
    ৪. গ্রুপে মেম্বার জয়েন করা (Join Call/Chat)
========================================================== */
router.post('/:groupId/join', async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.user?.sub;
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $addToSet: { members: userId } }, // ডুপ্লিকেট হবে না
      { new: true }
    );
    res.json({ message: "Successfully linked to hive", group });
  } catch (err) {
    res.status(500).json({ message: "Link failure" });
  }
});

export default router;